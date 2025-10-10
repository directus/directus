import api from '@/api';
import { useFlowsStore } from '@/stores/flows';
import { useNotificationsStore } from '@/stores/notifications';
import { notify } from '@/utils/notify';
import { translate } from '@/utils/translate-object-values';
import { unexpectedError } from '@/utils/unexpected-error';
import { useCollection } from '@directus/composables';
import formatTitle from '@directus/format-title';
import { FlowRaw } from '@directus/types';
import { computed, ref, unref, Ref } from 'vue';
import { useI18n } from 'vue-i18n';

export interface UseFlowsOptions {
	collection: Ref<string>;
	primaryKey: Ref<string | number | undefined>;
	selection: Ref<(number | string)[]>;
	location: Ref<'collection' | 'item'>;
	hasEdits: Ref<boolean>;
}

export function useFlows(options: UseFlowsOptions) {
	const { collection, primaryKey, selection, location, hasEdits } = options;

	const { t } = useI18n();
	const { primaryKeyField } = useCollection(collection);
	const flowsStore = useFlowsStore();
	const notificationStore = useNotificationsStore();

	const runningFlows = ref<string[]>([]);
	const confirmRunFlow = ref<string | null>(null);
	const confirmValues = ref<Record<string, any> | null>();
	const confirmedUnsavedChanges = ref(false);

	const manualFlows = computed(() =>
		flowsStore
			.getManualFlowsForCollection(collection.value)
			.filter(
				(flow) =>
					!flow.options?.location || flow.options?.location === 'both' || flow.options?.location === location.value,
			)
			.map((flow) => ({
				...flow,
				options: flow.options ? translate(flow.options) : null,
			})),
	);

	const isConfirmButtonDisabled = computed(() => {
		if (!confirmRunFlow.value) return true;

		for (const field of confirmDialogDetails.value?.fields || []) {
			if (
				field.meta?.required &&
				(!confirmValues.value ||
					confirmValues.value[field.field] === null ||
					confirmValues.value[field.field] === undefined)
			) {
				return true;
			}
		}

		return false;
	});

	const confirmButtonCTA = computed(() => {
		if (unref(location) === 'item') return t('run_flow_on_current');
		if (unref(selection).length === 0) return t('run_flow');
		return t('run_flow_on_selected', unref(selection).length);
	});

	const confirmDialogDetails = computed(() => {
		if (!unref(confirmRunFlow)) return null;

		const flow = unref(manualFlows).find((flow) => flow.id === unref(confirmRunFlow));

		if (!flow) return null;

		if (!flow.options?.requireConfirmation) return null;

		return {
			description: flow.options.confirmationDescription,
			fields: (flow.options.fields ?? []).map((field: Record<string, any>) => ({
				...field,
				name: !field.name && field.field ? formatTitle(field.field) : field.name,
			})),
		};
	});

	const displayUnsavedChangesDialog = computed(
		() => !!confirmRunFlow.value && (hasEdits?.value || false) && !confirmedUnsavedChanges.value,
	);

	const displayCustomConfirmDialog = computed(() => {
		return (
			!!confirmRunFlow.value &&
			!!confirmDialogDetails.value &&
			(!hasEdits.value || confirmedUnsavedChanges.value)
		);
	});

	function getFlowTooltip(manualFlow: FlowRaw) {
		if (location.value === 'item') return t('run_flow_on_current');

		if (manualFlow.options?.requireSelection === false && selection.value.length === 0) {
			return t('run_flow_on_current_collection');
		}

		return t('run_flow_on_selected', selection.value.length || 0);
	}

	function isFlowDisabled(manualFlow: FlowRaw) {
		if (location.value === 'item' || manualFlow.options?.requireSelection === false) return false;
		return !primaryKey.value && selection.value.length === 0;
	}

	function resetConfirm() {
		confirmRunFlow.value = null;
		confirmValues.value = null;
		confirmedUnsavedChanges.value = false;
	}

	function onFlowClick(flowId: string) {
		const flow = unref(manualFlows).find((flow) => flow.id === flowId);

		if (!flow) return;

		if (hasEdits.value || flow.options?.requireConfirmation) {
			confirmRunFlow.value = flowId;
		} else {
			runManualFlow(flowId);
		}
	}

	function confirmUnsavedChanges(flowId: string) {
		if (isConfirmButtonDisabled.value) return;

		confirmedUnsavedChanges.value = true;

		if (!confirmDialogDetails.value) {
			runManualFlow(flowId);
		}
	}

	async function runManualFlow(flowId: string, isActionDisabled = false, onRefresh: () => void) {
		if (isActionDisabled) return;

		confirmRunFlow.value = null;

		const selectedFlow = manualFlows.value.find((flow) => flow.id === flowId);

		if (!selectedFlow || !primaryKeyField.value) return;

		runningFlows.value = [...runningFlows.value, flowId];

		try {
			if (
				location.value === 'collection' &&
				selectedFlow.options?.requireSelection === false &&
				(selection.value.length || 0) === 0
			) {
				await api.post(`/flows/trigger/${flowId}`, {
					...(unref(confirmValues) ?? {}),
					collection: collection.value,
				});
			} else {
				const keys = primaryKey.value ? [primaryKey.value] : selection.value || [];

				await api.post(`/flows/trigger/${flowId}`, {
					...unref(confirmValues),
					collection: collection.value,
					keys,
				});
			}

			onRefresh();

			notify({
				title: t('trigger_flow_success', { flow: selectedFlow.name }),
			});

			await notificationStore.refreshUnreadCount();

			resetConfirm();
		} catch (error) {
			unexpectedError(error);
		} finally {
			runningFlows.value = runningFlows.value.filter((runningFlow) => runningFlow !== flowId);
		}
	}

	return {
		runningFlows,
		confirmRunFlow,
		confirmValues,
		confirmedUnsavedChanges,
		manualFlows,
		isConfirmButtonDisabled,
		confirmButtonCTA,
		confirmDialogDetails,
		displayUnsavedChangesDialog,
		displayCustomConfirmDialog,
		getFlowTooltip,
		isFlowDisabled,
		resetConfirm,
		onFlowClick,
		confirmUnsavedChanges,
		runManualFlow,
	};
}
