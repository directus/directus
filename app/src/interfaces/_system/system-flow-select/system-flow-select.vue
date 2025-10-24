<script setup lang="ts">
import { useFlowsStore } from '@/stores/flows';
import { ref } from 'vue';

const props = defineProps<{ value: Record<string, unknown>; collectionName: string }>();
defineEmits<{ input: [value: string | null] }>();

const flowsStore = useFlowsStore();

const flows = ref(
	flowsStore.flows
		.filter(
			(flow) =>
				flow.options &&
				flow.options.collections &&
				flow.options.collections.includes(props.collectionName) &&
				flow.options.location !== 'collection',
		)
		.map((flow) => ({
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
		@update:model-value="$emit('input', $event)"
	/>
</template>
∂
