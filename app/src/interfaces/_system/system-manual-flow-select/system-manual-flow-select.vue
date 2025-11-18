<script setup lang="ts">
import { useFlowsStore } from '@/stores/flows';
import { FlowRaw } from '@directus/types';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{ value: Record<string, unknown> | null; collectionName: string }>();
defineEmits<{ input: [value: string | null] }>();

const flowsStore = useFlowsStore();

const { t } = useI18n();

const flows = computed(() =>
	flowsStore.flows
		.filter(
			(flow: FlowRaw) =>
				flow.trigger === 'manual' &&
				flow.options &&
				flow.options.collections &&
				flow.options.collections.includes(props.collectionName) &&
				flow.options.location !== 'collection',
		)
		.map((flow: FlowRaw) => ({
			value: flow.id,
			text: `${flow.name}${(flow.description && ': ' + flow.description) || ''}${flow.status === 'inactive' ? ` (${t('inactive')})` : ''}`,
		})),
);
</script>

<template>
	<v-select
		:model-value="value"
		:items="flows"
		show-deselect
		:placeholder="$t('select_a_flow')"
		@update:model-value="$emit('input', $event)"
	/>
</template>
