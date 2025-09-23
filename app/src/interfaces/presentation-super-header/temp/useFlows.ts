import type { FlowRaw } from '@directus/types';
import type { Ref } from 'vue';
import { useApi, useStores } from '@directus/extensions-sdk';
import { getEndpoint } from '@directus/utils';
import { cloneDeep, isEqual } from 'lodash';
import { inject, ref } from 'vue';
import { useI18n } from 'vue-i18n';

// TODO: This is repeated in super-header.vue
export interface FlowIdentifier {
	collection: string;
	key: string;
}

export function useFlows(
	collection: string,
	primaryKeyRef: Ref<string | number | null> | null,
	onItemChanged?: () => void,
) {
	const { t } = useI18n();

	const api = useApi();
	const formValues = inject('values') as Record<string, any>;
	const { useNotificationsStore, useFlowsStore } = useStores();
	const notificationStore = useNotificationsStore();
	const flowsStore = useFlowsStore();
	const runningFlows = ref<string[]>([]);

	const confirmRunFlow = ref<string | null>(null);
	const confirmValues = ref<Record<string, any> | null>(null);
	const confirmedUnsavedChanges = ref(false);

	const getCurrentPrimaryKey = () => {
		// Get the latest value from the ref if available
		if (primaryKeyRef?.value && primaryKeyRef.value !== '+') {
			return primaryKeyRef.value;
		}

		// Otherwise check if the formValues has an ID we can use
		if (formValues.value?.id && formValues.value.id !== '+') {
			return formValues.value.id;
		}

		return null;
	};

	const getFlow = (flowId: string): FlowRaw | null => {
		const manualFlows = flowsStore.getManualFlowsForCollection(collection);
		const flow = manualFlows.find((f: FlowRaw) => f.id === flowId);
		return flow ?? null;
	};

	const resetConfirm = (onReset?: () => void) => {
		confirmRunFlow.value = null;
		confirmValues.value = null;
		confirmedUnsavedChanges.value = false;

		if (onReset) {
			onReset();
		}
	};

	// Function to check if an item has changed after a flow runs
	const checkItemChanges = async (originalValues: Record<string, any>) => {
		const currentPrimaryKey = getCurrentPrimaryKey();

		if (!currentPrimaryKey) {
			console.warn('Cannot check item changes: Invalid primary key');
			return false;
		}

		try {
			// Retrieve the updated item data
			const response = await getItem(collection, currentPrimaryKey);

			if (!response) {
				console.warn('Failed to retrieve updated item data');
				return false;
			}

			const updatedValues = response.data.data;

			// Check for key differences using lodash's isEqual for deep comparison
			let hasChanges = false;

			for (const key in originalValues) {
				// Only compare keys that exist in both objects
				if (key in updatedValues && !isEqual(originalValues[key], updatedValues[key])) {
					// Found a change in a field
					hasChanges = true;
					break;
				}
			}

			// Also check for any new keys that didn't exist before
			for (const key in updatedValues) {
				if (!(key in originalValues)) {
					// Found a new field
					hasChanges = true;
					break;
				}
			}

			return hasChanges;
		} catch (error) {
			console.error('Error checking item changes:', error);
			return false;
		}
	};

	const executeFlow = async (flowId: string, itemValues: Record<string, any>, flowFormData = {}) => {
		runningFlows.value = [...runningFlows.value, flowId];
		// Store a deep copy of the original values for later comparison
		const originalValues = cloneDeep(formValues.value || {});

		try {
			let keys: (string | number)[] = [];
			const currentPrimaryKey = getCurrentPrimaryKey();

			if (itemValues && itemValues.id && itemValues.id !== '+') {
				keys = [itemValues.id];
			} else if (currentPrimaryKey) {
				keys = [currentPrimaryKey];
			}

			const payload = {
				...flowFormData,
				collection,
				keys,
				$values: formValues.value,
			};

			const flow = getFlow(flowId);

			if (!flow) {
				console.error(`Flow with ID ${flowId} not found in store.`);

				notificationStore.add({
					title: t('unexpected_error'),
					text: `Flow ${flowId} not found.`,
					type: 'error',
				});

				return;
			}

			const response = await api.post(`/flows/trigger/${flowId}`, payload);

			resetConfirm();

			if (flow?.options?.async) {
				notificationStore.add({
					title: `Flow "${flow.name}" triggered successfully. It will run in the background`,
					// @TODO: Trigger flow translation not working
					// title: t('trigger_flow_success', { flow: flow.name }),
				});
			} else {
				notificationStore.add({
					title: `Flow "${flow.name}" ran successfully.`,
					// @TODO: Run flow translation not working
					// title: t('run_flow_success', { flow: flow.name }),
				});

				// Add a slight delay before checking for changes to allow the server to complete processing
				await new Promise((resolve) => setTimeout(resolve, 1000));

				// Check if the item has been changed by the flow
				const hasChanges = await checkItemChanges(originalValues);

				if (hasChanges && onItemChanged) {
					// Call the callback function to show the confirmation dialog
					onItemChanged();
				}
			}

			return response.data;
		} catch (error) {
			console.error(`Error running flow ${flowId}:`, error);

			notificationStore.add({
				title: t('unexpected_error'),
				type: 'error',
				code: 'UNKNOWN',
				dialog: true,
				error,
			});

			resetConfirm();
		} finally {
			runningFlows.value = runningFlows.value.filter((id) => id !== flowId);
		}
	};

	const runFlow = async (flowIdentifier: FlowIdentifier, itemValues: Record<string, any>, hasEdits = false) => {
		const flow = getFlow(flowIdentifier.key);

		if (!flow) {
			console.error(`Flow ${flowIdentifier.key} not found.`);

			notificationStore.add({
				title: t('unexpected_error'),
				text: `Flow ${flowIdentifier.key} not found.`,
				type: 'error',
			});

			return;
		}

		const flowId = flowIdentifier.key;

		const currentItemValues = { ...itemValues };

		if (hasEdits && !confirmedUnsavedChanges.value) {
			confirmRunFlow.value = flowId;
			confirmValues.value = currentItemValues;
			return;
		}

		if (flow.options?.requireConfirmation) {
			confirmRunFlow.value = flowId;
			confirmValues.value = currentItemValues;
			return;
		}

		return executeFlow(flowId, currentItemValues);
	};

	const executeConfirmedFlow = (flowId: string, formData: Record<string, any>, onReset?: () => void) => {
		if (!flowId) return;

		const itemValues = confirmValues.value || {};

		if (onReset) {
			onReset();
		}

		executeFlow(flowId, itemValues, formData);
	};

	async function getItem(collection: string, primaryKey: string | number | null) {
		if (!primaryKey) return null;

		try {
			const endpoint = getEndpoint(collection);
			const item = await api.get(`${endpoint}/${primaryKey}`);
			return item;
		} catch (error) {
			console.error('Error fetching item:', error);
			return null;
		}
	}

	return {
		runningFlows,
		confirmRunFlow,
		getFlow,
		runFlow,
		resetConfirm,
		executeConfirmedFlow,
		confirmValues,
	};
}
