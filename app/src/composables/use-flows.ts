import api from '@/api';
import { computed, ref, provide, inject, unref, type Ref } from 'vue';
import { FlowRaw, Item, PrimaryKey } from '@directus/types';
import { notify } from '@/utils/notify';
import { translate } from '@/utils/translate-object-values';
import { unexpectedError } from '@/utils/unexpected-error';
import { useCollection } from '@directus/composables';
import { useFlowsStore } from '@/stores/flows';
import { useI18n } from 'vue-i18n';
import { useNotificationsStore } from '@/stores/notifications';
import formatTitle from '@directus/format-title';

interface UseFlowsOptions {
	collection: Ref<string>;
	primaryKey?: Ref<PrimaryKey | null>;
	selection?: Ref<Item[]>;
	location: 'collection' | 'item';
	hasEdits?: Ref<boolean>;
	onRefreshCallback: () => void;
}

export type ManualFlow = FlowRaw & {
	tooltip: string;
	isFlowDisabled: boolean;
};

const runManualFlowSymbol = 'runManualFlow';

export function useFlows(options: UseFlowsOptions) {
	const { collection, hasEdits = ref(false), location, onRefreshCallback, primaryKey, selection = ref([]) } = options;

	const { t } = useI18n();
	const { primaryKeyField } = useCollection(collection);
	const flowsStore = useFlowsStore();
	const notificationStore = useNotificationsStore();

	const runningFlows = ref<string[]>([]);
	const confirmValues = ref<Record<string, any> | null>(null);
	const confirmedUnsavedChanges = ref<boolean>(false);
	const confirmedCustomDialog = ref<boolean>(false);
	const currentFlowId = ref<string | null>(null);

	const currentFlow = computed(() => {
		if (!currentFlowId.value) return null;

		return manualFlows.value.find((flow) => flow.id === currentFlowId.value);
	});

	const currentFlowConfirmations = computed(() => {
		if (!currentFlow.value) return null;

		return {
			isUnsavedChangesConfirmationRequired: hasEdits.value,
			isUnsavedChangesConfirmed: confirmedUnsavedChanges.value,
			isCustomDialogConfirmationRequired: currentFlow.value.options?.requireConfirmation,
			isCustomDialogConfirmed: confirmedCustomDialog.value,
		};
	});

	const flowDialogsContext = computed(() => ({
		confirmButtonCTA: confirmButtonCTA.value,
		confirmDialogDetails: confirmDialogDetails.value,
		confirmUnsavedChanges,
		confirmCustomDialog,
		confirmValues: confirmValues.value,
		currentFlowId: currentFlowId.value,
		displayCustomConfirmDialog: displayCustomConfirmDialog.value,
		displayUnsavedChangesDialog: displayUnsavedChangesDialog.value,
		isConfirmButtonDisabled: isConfirmButtonDisabled.value,
		resetConfirm,
		updateFieldValues,
	}));

	const confirmButtonCTA = computed(() => {
		if (displayUnsavedChangesDialog.value) return t('run_flow_anyway');
		if (location === 'item') return t('run_flow_on_current');
		if (selection.value.length === 0) return t('run_flow');
		return t('run_flow_on_selected', selection.value.length);
	});

	const confirmDialogDetails = computed(() => {
		if (!currentFlow.value) return null;

		if (!currentFlow.value.options?.requireConfirmation) return null;

		return {
			description: currentFlow.value.options.confirmationDescription,
			fields: (currentFlow.value.options.fields ?? []).map((field: Record<string, any>) => ({
				...field,
				name: !field.name && field.field ? formatTitle(field.field) : field.name,
			})),
		};
	});

	const displayCustomConfirmDialog = computed(
		() =>
			!!currentFlowId.value &&
			!!confirmDialogDetails.value &&
			!!currentFlowConfirmations.value?.isCustomDialogConfirmationRequired &&
			!currentFlowConfirmations.value?.isCustomDialogConfirmed &&
			!displayUnsavedChangesDialog.value,
	);

	const displayUnsavedChangesDialog = computed(
		() =>
			!!currentFlowId.value &&
			!!currentFlowConfirmations.value?.isUnsavedChangesConfirmationRequired &&
			!currentFlowConfirmations.value?.isUnsavedChangesConfirmed,
	);

	const isConfirmButtonDisabled = computed(() => {
		if (!currentFlowId.value) return true;

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

	const manualFlows = computed<ManualFlow[]>(() => {
		const manualFlows = flowsStore
			.getManualFlowsForCollection(collection.value)
			.filter(
				(flow) => !flow.options?.location || flow.options?.location === 'both' || flow.options?.location === location,
			)
			.map((flow) => ({
				...flow,
				options: flow.options ? translate(flow.options) : null,
				tooltip: getFlowTooltip(flow),
				isFlowDisabled: checkFlowDisabled(flow),
			}));

		function getFlowTooltip(manualFlow: FlowRaw) {
			if (location === 'item') return t('run_flow_on_current');

			if (manualFlow.options?.requireSelection === false && selection.value.length === 0) {
				return t('run_flow_on_current_collection');
			}

			return t('run_flow_on_selected', selection.value.length || 0);
		}

		function checkFlowDisabled(manualFlow: FlowRaw) {
			if (location === 'item' || manualFlow.options?.requireSelection === false) return false;
			return !unref(primaryKey) && selection.value.length === 0;
		}

		return manualFlows;
	});

	function isActiveFlow(flowId: string) {
		const flow = manualFlows.value.find((flow) => flow.id === flowId);

		return flow && flow.status === 'active';
	}

	function resetConfirm() {
		currentFlowId.value = null;
		confirmValues.value = null;
		confirmedUnsavedChanges.value = false;
		confirmedCustomDialog.value = false;
	}

	function confirmUnsavedChanges(flowId: string) {
		confirmedUnsavedChanges.value = true;

		if (!confirmDialogDetails.value) {
			runManualFlow(flowId);
		}
	}

	function confirmCustomDialog(flowId: string) {
		if (isConfirmButtonDisabled.value) return;

		confirmedCustomDialog.value = true;

		runManualFlow(flowId);
	}

	function provideRunManualFlow() {
		provide(runManualFlowSymbol, {
			runManualFlow,
			runningFlows,
			isActiveFlow,
		});
	}

	function updateFieldValues(event: Record<string, any>) {
		confirmValues.value = event;
	}

	async function runManualFlow(flowId: string) {
		currentFlowId.value = flowId;

		if (!currentFlowId.value || !currentFlow.value || !currentFlowConfirmations.value) return;

		const {
			isUnsavedChangesConfirmationRequired,
			isUnsavedChangesConfirmed,
			isCustomDialogConfirmationRequired,
			isCustomDialogConfirmed,
		} = currentFlowConfirmations.value;

		if (
			(isUnsavedChangesConfirmationRequired && !isUnsavedChangesConfirmed) ||
			(isCustomDialogConfirmationRequired && !isCustomDialogConfirmed)
		) {
			return;
		}

		if (!primaryKeyField.value) return;

		runningFlows.value = [...runningFlows.value, flowId];

		try {
			if (
				location === 'collection' &&
				currentFlow.value.options?.requireSelection === false &&
				selection.value.length === 0
			) {
				await api.post(`/flows/trigger/${flowId}`, {
					...(confirmValues.value ?? {}),
					collection: collection.value,
				});
			} else {
				const pk = unref(primaryKey);
				const keys = pk ? [pk] : selection.value || [];

				await api.post(`/flows/trigger/${flowId}`, {
					...confirmValues.value,
					collection: collection.value,
					keys,
				});
			}

			onRefreshCallback();

			notify({
				title: t('trigger_flow_success', { flow: currentFlow.value.name }),
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
		flowDialogsContext,
		manualFlows,
		provideRunManualFlow,
		runManualFlow,
	};
}

/**
 * In order to invoke useInjectRunManualFlow within a component, a parent component must first invoke `provideRunManualFlow()`.
 *
 * This parent component must also render the <flow-dialogs> component or the confirmation dialogs will not be reachable.
 */
export function useInjectRunManualFlow() {
	return inject(runManualFlowSymbol, {
		runManualFlow: (_flowId: string) => {},
		runningFlows: ref<string[]>([]),
		isActiveFlow: (_flowId: string) => false,
	});
}
