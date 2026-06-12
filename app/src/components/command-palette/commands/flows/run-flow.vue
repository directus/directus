<script setup lang="ts">
import { useApi } from '@directus/composables';
import type { FlowRaw, Item } from '@directus/types';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { useCommandPalette } from '../../composables/use-command-palette';
import { useCommandRouter } from '../../composables/use-command-router';
import { getRoutePrimaryKey } from '../../utils/get-route-primary-key';
import {
	getManualFlowConfirmDetails,
	isManualFlowConfirmButtonDisabled,
	triggerManualFlow,
} from '@/composables/use-flows/lib/manual-flow';
import { useNotificationsStore } from '@/stores/notifications';
import { notify } from '@/utils/notify';
import { unexpectedError } from '@/utils/unexpected-error';
import FlowDialogs from '@/views/private/components/flow-dialogs.vue';

const props = defineProps<{
	flow: FlowRaw;
	location: 'item' | 'collection';
}>();

const { t } = useI18n();
const api = useApi();
const route = useRoute();
const notificationsStore = useNotificationsStore();
const { close } = useCommandPalette();
const { pop: goBack } = useCommandRouter();

const selection = ref<Item[]>([]);
const confirmValues = ref<Record<string, any> | null>(null);

const collection = computed(() => (typeof route.params.collection === 'string' ? route.params.collection : ''));
const primaryKey = computed(() => getRoutePrimaryKey(route.params.primaryKey) ?? null);

async function runFlow() {
	try {
		await triggerManualFlow({
			api,
			flow: props.flow,
			collection: collection.value,
			location: props.location,
			primaryKey,
			selection,
			values: confirmValues.value,
		});

		notify({
			title: t('trigger_flow_success', { flow: props.flow.name }),
		});

		await notificationsStore.refreshUnreadCount();
		close();
	} catch (error) {
		unexpectedError(error);
	}
}

function confirmCustomDialog() {
	if (isConfirmButtonDisabled.value) return;

	runFlow();
}

const confirmDetails = computed(() => getManualFlowConfirmDetails(props.flow));
const currentFlowId = computed(() => props.flow.id);

const isConfirmButtonDisabled = computed(() =>
	isManualFlowConfirmButtonDisabled(currentFlowId.value, confirmDetails.value, confirmValues.value),
);

const confirmButtonCTA = computed(() => {
	if (props.location === 'item') return t('run_flow_on_current');
	if (selection.value.length === 0) return t('run_flow');
	return t('run_flow_on_selected', selection.value.length);
});

const displayCustomConfirmDialog = computed(() => !!confirmDetails.value);

const flowDialogsContext = computed(() => ({
	confirmButtonCTA: confirmButtonCTA.value,
	confirmDialogDetails: confirmDetails.value,
	confirmUnsavedChanges: () => {},
	confirmCustomDialog,
	confirmValues: confirmValues.value,
	currentFlowId: currentFlowId.value,
	displayCustomConfirmDialog: displayCustomConfirmDialog.value,
	displayUnsavedChangesDialog: false,
	isConfirmButtonDisabled: isConfirmButtonDisabled.value,
	resetConfirm,
	updateFieldValues: (values: Record<string, any>) => {
		confirmValues.value = values;
	},
}));

function resetConfirm() {
	goBack();
}
</script>

<template>
	<FlowDialogs v-bind="flowDialogsContext" :keep-behind="false" />
</template>
