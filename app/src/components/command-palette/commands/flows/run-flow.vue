<script setup lang="ts">
import { useApi } from '@directus/composables';
import formatTitle from '@directus/format-title';
import type { FlowRaw, PrimaryKey } from '@directus/types';
import { computed, ref, unref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { useCommandPalette } from '../../composables/use-command-palette';
import { useCommandRouter } from '../../composables/use-command-router';
import { getRoutePrimaryKey } from '../../utils/get-route-primary-key';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VForm from '@/components/v-form/v-form.vue';
import { useNotificationsStore } from '@/stores/notifications';
import { unexpectedError } from '@/utils/unexpected-error';

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

const selection = ref<PrimaryKey[]>([]);
const confirmValues = ref<Record<string, any> | null>();

const collection = computed(() => route.params.collection);
const primaryKey = computed(() => getRoutePrimaryKey(route.params.primaryKey));

async function runFlow() {
	const flow = props.flow;

	try {
		if (props.location === 'collection' && flow.options?.requireSelection === false && selection.value.length === 0) {
			await api.post(`/flows/trigger/${flow.id}`, {
				...unref(confirmValues),
				collection: collection.value,
			});
		} else {
			const keys = primaryKey.value ? [primaryKey.value] : selection.value;

			await api.post(`/flows/trigger/${flow.id}`, {
				...unref(confirmValues),
				collection: collection.value,
				keys,
			});
		}

		notificationsStore.add({
			title: t('run_flow_success', { flow: flow.name }),
		});

		resetConfirm();
		close();
	} catch (error) {
		unexpectedError(error);
	}
}

const confirmDetails = computed(() => {
	const flow = props.flow;

	if (!flow.options?.requireConfirmation) return null;

	return {
		description: flow.options.confirmationDescription,
		fields: (flow.options.fields ?? []).map((field: Record<string, any>) => ({
			...field,
			name: !field.name && field.field ? formatTitle(field.field) : field.name,
		})),
	};
});

const isConfirmButtonDisabled = computed(() => {
	for (const field of confirmDetails.value?.fields || []) {
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
	if (props.location === 'item') return t('run_flow_on_current');
	if (unref(selection).length === 0) return t('run_flow');
	return t('run_flow_on_selected', unref(selection).length);
});

const displayCustomConfirmDialog = computed(() => !!confirmDetails.value);

function resetConfirm() {
	goBack();
}
</script>

<template>
	<VDialog :model-value="displayCustomConfirmDialog" @esc="resetConfirm">
		<VCard class="allow-drawer">
			<VCardTitle>
				{{ confirmDetails!.description ?? t('run_flow_confirm') }}
			</VCardTitle>
			<VCardText class="confirm-form">
				<VForm
					v-if="confirmDetails!.fields && confirmDetails!.fields.length > 0"
					:fields="confirmDetails!.fields"
					:model-value="confirmValues"
					autofocus
					primary-key="+"
					@update:model-value="confirmValues = $event"
				/>
			</VCardText>

			<VCardActions>
				<VButton secondary @click="resetConfirm">
					{{ t('cancel') }}
				</VButton>
				<VButton :disabled="isConfirmButtonDisabled" @click="runFlow">
					{{ confirmButtonCTA }}
				</VButton>
			</VCardActions>
		</VCard>
	</VDialog>
</template>
