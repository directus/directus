<script setup lang="ts">
import { useFlowsStore } from '@/stores/flows';
import { FlowRaw } from '@directus/types';
import { computed } from 'vue';

const props = defineProps<{ value: Record<string, unknown>; collectionName: string }>();
defineEmits<{ input: [value: string | null] }>();

const flowsStore = useFlowsStore();

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
			id: flow.id,
			displayText: `${flow.name}${(flow.description && ': ' + flow.description) || ''}`,
		})),
);
</script>

<template>
	<v-select
		:model-value="value"
		:items="flows"
		:item-text="'displayText'"
		:item-value="'id'"
		show-deselect
		:placeholder="$t('select_a_flow')"
		@update:model-value="$emit('input', $event)"
	/>
</template>
∂
