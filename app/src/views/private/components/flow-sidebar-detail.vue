<template>
	<sidebar-detail v-if="manualFlows.length > 0" icon="bolt" :title="t('flows')">
		<div class="fields">
			<div v-for="manualFlow in manualFlows" :key="manualFlow.id" class="field full">
				<v-button
					v-tooltip="getFlowTooltip(manualFlow)"
					small
					full-width
					:loading="runningFlows.includes(manualFlow.id)"
					:disabled="isFlowDisabled(manualFlow)"
					@click="onFlowClick(manualFlow.id)"
				>
					<v-icon :name="manualFlow.icon ?? 'bolt'" small left />
					{{ manualFlow.name }}
				</v-button>
			</div>
		</div>

		<v-dialog :model-value="!!confirmRunFlow" @esc="resetConfirm">
			<v-card>
				<template v-if="confirmDetails">
					<v-card-title>{{ confirmDetails.description ?? t('run_flow_confirm') }}</v-card-title>

					<v-card-text class="confirm-form">
						<v-form
							v-if="confirmDetails.fields && confirmDetails.fields.length > 0"
							:fields="confirmDetails.fields"
							:model-value="confirmValues"
							autofocus
							primary-key="+"
							@update:model-value="confirmValues = $event"
						/>
					</v-card-text>
				</template>

				<template v-else>
					<v-card-title>{{ t('unsaved_changes') }}</v-card-title>
					<v-card-text>{{ t('run_flow_on_current_edited_confirm') }}</v-card-text>
				</template>

				<v-card-actions>
					<v-button secondary @click="resetConfirm">
						{{ t('cancel') }}
					</v-button>
					<v-button :disabled="isConfirmButtonDisabled" @click="runManualFlow(confirmRunFlow!)">
						{{ confirmButtonCTA }}
					</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</sidebar-detail>
</template>

<script setup lang="ts">
import api from '@/api';
import { useFlowsStore } from '@/stores/flows';
import { notify } from '@/utils/notify';
import { unexpectedError } from '@/utils/unexpected-error';
import { useCollection } from '@directus/composables';
import { FlowRaw } from '@directus/types';
import { computed, ref, toRefs, unref } from 'vue';
import { useI18n } from 'vue-i18n';
import { translate } from '@/utils/translate-object-values';
import formatTitle from '@directus/format-title';

interface Props {
	collection: string;
	primaryKey?: string | number;
	selection?: (number | string)[];
	location: 'collection' | 'item';
	hasEdits?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	primaryKey: undefined,
	selection: () => [],
	hasEdits: false,
});

const emit = defineEmits(['refresh']);

const { t } = useI18n();

const { collection, primaryKey, selection, location, hasEdits } = toRefs(props);

const { primaryKeyField } = useCollection(collection);

const flowsStore = useFlowsStore();

const manualFlows = computed(() =>
	flowsStore
		.getManualFlowsForCollection(collection.value)
		.filter(
			(flow) =>
				!flow.options?.location || flow.options?.location === 'both' || flow.options?.location === props.location
		)
		.map((flow) => ({
			...flow,
			options: flow.options ? translate(flow.options) : null,
		}))
);

const runningFlows = ref<string[]>([]);

const confirmRunFlow = ref<string | null>(null);
const confirmValues = ref<Record<string, any> | null>();

const isConfirmButtonDisabled = computed(() => {
	if (!confirmRunFlow.value) return true;

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
	if (unref(props.location) === 'item') return t('run_flow_on_current');
	if (unref(props.selection).length === 0) return t('run_flow');
	return t('run_flow_on_selected', unref(props.selection).length);
});

const confirmDetails = computed(() => {
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

const resetConfirm = () => {
	confirmRunFlow.value = null;
	confirmValues.value = null;
};

const getFlowTooltip = (manualFlow: FlowRaw) => {
	if (location.value === 'item') return t('run_flow_on_current');

	if (manualFlow.options?.requireSelection === false && selection.value.length === 0) {
		return t('run_flow_on_current_collection');
	}

	return t('run_flow_on_selected', selection.value.length);
};

const isFlowDisabled = (manualFlow: FlowRaw) => {
	if (location.value === 'item' || manualFlow.options?.requireSelection === false) return false;
	return !primaryKey.value && selection.value.length === 0;
};

const onFlowClick = async (flowId: string) => {
	const flow = unref(manualFlows).find((flow) => flow.id === flowId);

	if (!flow) return;

	if (hasEdits.value || flow.options?.requireConfirmation) {
		confirmRunFlow.value = flowId;
	} else {
		runManualFlow(flowId);
	}
};

const runManualFlow = async (flowId: string) => {
	confirmRunFlow.value = null;

	const selectedFlow = manualFlows.value.find((flow) => flow.id === flowId);

	if (!selectedFlow || !primaryKeyField.value) return;

	runningFlows.value = [...runningFlows.value, flowId];

	try {
		if (
			location.value === 'collection' &&
			selectedFlow.options?.requireSelection === false &&
			selection.value.length === 0
		) {
			await api.post(`/flows/trigger/${flowId}`, { ...(unref(confirmValues) ?? {}), collection: collection.value });
		} else {
			const keys = primaryKey.value ? [primaryKey.value] : selection.value;
			await api.post(`/flows/trigger/${flowId}`, { ...unref(confirmValues), collection: collection.value, keys });
		}

		emit('refresh');

		notify({
			title: t('run_flow_success', { flow: selectedFlow.name }),
		});

		resetConfirm();
	} catch (err: any) {
		unexpectedError(err);
	} finally {
		runningFlows.value = runningFlows.value.filter((runningFlow) => runningFlow !== flowId);
	}
};
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';

.fields {
	@include form-grid;
}

.fields {
	--form-vertical-gap: 24px;

	.type-label {
		font-size: 1rem;
	}
}

:deep(.v-button) .button:disabled {
	--v-button-background-color-disabled: var(--background-normal-alt);
}

.v-icon {
	margin-right: 8px;
}

.confirm-form {
	--form-horizontal-gap: 24px;
	--form-vertical-gap: 24px;

	margin-top: var(--v-card-padding);

	:deep(.type-label) {
		font-size: 1rem;
	}
}
</style>
