<script setup lang="ts">
import { useFlowsStore } from '@/stores/flows';
import { ref } from 'vue';

defineProps<{ value: Record<string, unknown> }>();
defineEmits<{ input: [value: string | null] }>();

const flowsStore = useFlowsStore();

const flows = ref(flowsStore.flows.map((flow) => ({ name: flow.name, id: flow.id })));
</script>

<template>
	<v-select
		:model-value="value"
		:items="flows"
		:item-text="'name'"
		:item-value="'id'"
		show-deselect
		@update:model-value="$emit('input', $event)"
	/>
</template>
∂
