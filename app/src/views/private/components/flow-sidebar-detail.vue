<template>
	<sidebar-detail v-if="selectableFlows.length > 0" icon="bolt" :title="t('flows')">
		<div class="fields">
			<div class="field full">
				<v-select v-model="selectedFlowId" :items="selectableFlows" :placeholder="t('select_a_flow')" item-icon="icon">
					<template v-if="selectedFlow" #prepend>
						<v-icon :name="selectedFlow!.icon" />
					</template>
				</v-select>
			</div>
			<div class="field full">
				<v-button
					small
					full-width
					:disabled="!selectedFlowId || (!primaryKey && selection.length === 0)"
					@click="runManualFlow"
				>
					{{ primaryKey ? t('run_flow_on_current') : t('run_flow_on_selected', selection.length) }}
				</v-button>
			</div>
		</div>
	</sidebar-detail>
</template>

<script lang="ts" setup>
import api from '@/api';
import { useFlowsStore } from '@/stores';
import { notify } from '@/utils/notify';
import { unexpectedError } from '@/utils/unexpected-error';
import { useCollection } from '@directus/shared/composables';
import { computed, ref, toRefs, watch } from 'vue';
import { useI18n } from 'vue-i18n';

interface Props {
	collection: string;
	primaryKey?: string;
	selection: (number | string)[];
}

const props = withDefaults(defineProps<Props>(), {
	primaryKey: undefined,
	selection: () => [],
});

const { t } = useI18n();

const { collection, primaryKey, selection } = toRefs(props);

const { primaryKeyField } = useCollection(collection);

const flowsStore = useFlowsStore();

const manualFlows = computed(() => flowsStore.getManualFlowsForCollection(collection.value));

const selectableFlows = computed(() =>
	manualFlows.value.map((flow) => {
		return { text: flow.name, value: flow.id, icon: flow.icon ?? 'bolt' };
	})
);

const selectedFlowId = ref<string | null>(null);

watch(collection, () => {
	selectedFlowId.value = null;
});

const selectedFlow = computed(() => manualFlows.value.find((flow) => flow.id === selectedFlowId.value));

const isRunning = ref<boolean>(false);

async function runManualFlow() {
	if (!selectedFlow.value || !primaryKeyField.value) return;

	isRunning.value = true;

	try {
		const keys = primaryKey.value ? [primaryKey.value] : selection.value;

		await api.post(`/flows/trigger/${selectedFlow.value.id}`, { collection: collection.value, keys });

		notify({
			title: t('run_flow_success', { flow: selectedFlow.value.name }),
		});
	} catch (err: any) {
		unexpectedError(err);
	} finally {
		isRunning.value = false;
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

.download-local {
	color: var(--foreground-subdued);
	text-align: center;
	display: block;
	width: 100%;
	margin-top: 8px;
	transition: color var(--fast) var(--transition);

	&:hover {
		color: var(--primary);
	}
}
</style>
