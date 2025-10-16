import api from '@/api';
import { computed, ref, Ref, provide, inject, ComputedRef } from 'vue';
import { FlowRaw, Item, PrimaryKey } from '@directus/types';
import { notify } from '@/utils/notify';
import { translate } from '@/utils/translate-object-values';
import { unexpectedError } from '@/utils/unexpected-error';
import { useCollection } from '@directus/composables';
import { useFlowsStore } from '@/stores/flows';
import { useI18n } from 'vue-i18n';
import { useNotificationsStore } from '@/stores/notifications';
import formatTitle from '@directus/format-title';

export interface UseFlowsOptions {
	collection: Ref<string>;
	primaryKey?: ComputedRef<PrimaryKey | null>;
	selection?: Ref<Item[]>;
	location: Ref<'collection' | 'item'>;
	hasEdits?: Ref<boolean>;
	onRefreshCallback: () => void;
}

export interface FlowDialogsContext {
	confirmButtonCTA: ComputedRef<string>;
	confirmDialogDetails: ComputedRef<{
		description: any;
		fields: any;
	} | null>;
	flowToConfirm: Ref<string | null>;
	confirmUnsavedChanges: (flowId: string) => void;
	confirmValues: Ref<Record<string, any> | null>;
	displayCustomConfirmDialog: ComputedRef<boolean>;
	displayUnsavedChangesDialog: ComputedRef<boolean>;
	isConfirmButtonDisabled: ComputedRef<boolean>;
	resetConfirm: () => void;
	updateFieldValues: (event: any) => void;
}

const runManualFlowSymbol = 'runManualFlow';

export function useFlows(options: UseFlowsOptions) {
	const { collection, hasEdits = ref(false), location, onRefreshCallback, primaryKey, selection = ref([]) } = options;

	const { t } = useI18n();
	const { primaryKeyField } = useCollection(collection);
	const flowsStore = useFlowsStore();
	const notificationStore = useNotificationsStore();

	const runningFlows = ref<string[]>([]);
	const flowToConfirm = ref<string | null>(null);
	const confirmValues = ref<Record<string, any> | null>(null);
	const confirmedUnsavedChanges = ref(false);

	const flowDialogsContext = computed(() => ({
		confirmButtonCTA,
		confirmDialogDetails,
		flowToConfirm,
		confirmUnsavedChanges,
		confirmValues,
		displayCustomConfirmDialog,
		displayUnsavedChangesDialog,
		isConfirmButtonDisabled,
		resetConfirm,
		updateFieldValues,
	}));

	const confirmButtonCTA = computed(() => {
		if (location.value === 'item') return t('run_flow_on_current');
		if (selection.value.length === 0) return t('run_flow');
		return t('run_flow_on_selected', selection.value.length);
	});

	const confirmDialogDetails = computed(() => {
		if (!flowToConfirm.value) return null;

		const flow = manualFlows.value.find((flow) => flow.id === flowToConfirm.value);

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

	const displayCustomConfirmDialog = computed(() => {
		return !!flowToConfirm.value && !!confirmDialogDetails.value && (!hasEdits.value || confirmedUnsavedChanges.value);
	});

	const displayUnsavedChangesDialog = computed(
		() => !!flowToConfirm.value && hasEdits.value && !confirmedUnsavedChanges.value,
	);

	const isConfirmButtonDisabled = computed(() => {
		if (!flowToConfirm.value) return true;

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

	const manualFlows = computed(() => {
		const manualFlows = flowsStore
			.getManualFlowsForCollection(collection.value)
			.filter(
				(flow) =>
					!flow.options?.location || flow.options?.location === 'both' || flow.options?.location === location.value,
			)
			.map((flow) => ({
				...flow,
				options: flow.options ? translate(flow.options) : null,
				tooltip: getFlowTooltip(flow),
				isFlowDisabled: checkFlowDisabled(flow),
				isFlowRunning: checkFlowRunning(flow),
			}));

		function getFlowTooltip(manualFlow: FlowRaw) {
			if (location.value === 'item') return t('run_flow_on_current');

			if (manualFlow.options?.requireSelection === false && selection.value.length === 0) {
				return t('run_flow_on_current_collection');
			}

			return t('run_flow_on_selected', selection.value.length || 0);
		}

		function checkFlowDisabled(manualFlow: FlowRaw) {
			if (location.value === 'item' || manualFlow.options?.requireSelection === false) return false;
			return !primaryKey?.value && selection.value.length === 0;
		}

		function checkFlowRunning(manualFlow: FlowRaw) {
			if (!manualFlow) return false;
			return runningFlows.value.includes(manualFlow.id);
		}

		return manualFlows;
	});

	function resetConfirm() {
		flowToConfirm.value = null;
		confirmValues.value = null;
		confirmedUnsavedChanges.value = false;
	}

	function confirmUnsavedChanges(flowId: string) {
		confirmedUnsavedChanges.value = true;

		if (!confirmDialogDetails.value) {
			runManualFlow(flowId, false);
		}
	}

	function provideRunManualFlow() {
		provide(runManualFlowSymbol, {
			runManualFlow,
		});
	}

	function updateFieldValues(event: Record<string, any>) {
		confirmValues.value = event;
	}

	async function runManualFlow(flowId: string, isActionDisabled = false) {
		if (isActionDisabled) return;

		const flow = manualFlows.value.find((flow) => flow.id === flowId);

		if (!flow) return;

		if (
			(hasEdits.value && !confirmedUnsavedChanges.value) ||
			(flow.options?.requireConfirmation && flowToConfirm.value !== flowId)
		) {
			flowToConfirm.value = flowId;
			return;
		} else {
			flowToConfirm.value = null;

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
						...(confirmValues.value ?? {}),
						collection: collection.value,
					});
				} else {
					const keys = primaryKey?.value ? [primaryKey.value] : selection.value || [];

					await api.post(`/flows/trigger/${flowId}`, {
						...confirmValues.value,
						collection: collection.value,
						keys,
					});
				}

				onRefreshCallback();

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
	}

	return {
		flowDialogsContext,
		manualFlows,
		provideRunManualFlow,
		runManualFlow,
	};
}

/**
 * In order to invoke injectRunManualFlow within a component, the parent component must first invoke provideRunManualFlow
 *
 * The parent component must also render the <flow-dialogs> component or the confirmation dialogs will not be reachable
 */
export function injectRunManualFlow() {
	return inject(runManualFlowSymbol) as {
		runManualFlow: (flowId: string, isActionDisabled: boolean) => void;
	};
}
