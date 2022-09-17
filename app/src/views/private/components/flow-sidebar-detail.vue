<template>
	<sidebar-detail v-if="manualFlows.length > 0" icon="bolt" :title="t('flows')">
		<div class="fields">
			<div v-for="manualFlow in manualFlows" :key="manualFlow.id" class="field full">
				<v-button
					v-tooltip="primaryKey ? t('run_flow_on_current') : t('run_flow_on_selected', selection.length)"
					small
					full-width
					:loading="runningFlows.includes(manualFlow.id)"
					:disabled="!primaryKey && selection.length === 0"
					@click="onFlowClick(manualFlow.id)"
				>
					<v-icon :name="manualFlow.icon ?? 'bolt'" small left />
					{{ manualFlow.name }}
				</v-button>
			</div>
		</div>

		<v-dialog :model-value="!!confirmRunFlow" @esc="confirmRunFlow = null">
			<v-card>
				<v-card-title>{{ t('unsaved_changes') }}</v-card-title>
				<v-card-text>{{ t('run_flow_on_current_edited_confirm') }}</v-card-text>

				<v-card-actions>
					<v-button secondary @click="confirmRunFlow = null">
						{{ t('cancel') }}
					</v-button>
					<v-button @click="runManualFlow(confirmRunFlow!)">
						{{ t('run_flow_on_current') }}
					</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</sidebar-detail>
</template>

<script lang="ts" setup>
import api from '@/api';
import { useFlowsStore } from '@/stores/flows';
import { notify } from '@/utils/notify';
import { unexpectedError } from '@/utils/unexpected-error';
import { useCollection } from '@directus/shared/composables';
import { computed, ref, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';

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

const { collection, primaryKey, selection, hasEdits } = toRefs(props);

const { primaryKeyField } = useCollection(collection);

const flowsStore = useFlowsStore();

const manualFlows = computed(() =>
	flowsStore
		.getManualFlowsForCollection(collection.value)
		.filter(
			(flow) =>
				!flow.options?.location || flow.options?.location === 'both' || flow.options?.location === props.location
		)
);

const runningFlows = ref<string[]>([]);

const confirmRunFlow = ref<string | null>(null);

async function onFlowClick(flowId: string) {
	if (hasEdits.value) {
		confirmRunFlow.value = flowId;
	} else {
		runManualFlow(flowId);
	}
}

async function runManualFlow(flowId: string) {
	confirmRunFlow.value = null;

	const selectedFlow = manualFlows.value.find((flow) => flow.id === flowId);

	if (!selectedFlow || !primaryKeyField.value) return;

	runningFlows.value = [...runningFlows.value, flowId];

	try {
		const keys = primaryKey.value ? [primaryKey.value] : selection.value;

		await api.post(`/flows/trigger/${flowId}`, { collection: collection.value, keys });

		emit('refresh');

		notify({
			title: t('run_flow_success', { flow: selectedFlow.name }),
		});
	} catch (err: any) {
		unexpectedError(err);
	} finally {
		runningFlows.value = runningFlows.value.filter((runningFlow) => runningFlow !== flowId);
	}
}
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
</style>
