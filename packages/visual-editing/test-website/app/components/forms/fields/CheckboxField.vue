<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
	modelValue: boolean;
	name: string;
	label: string;
}>();

const emits = defineEmits(['update:modelValue']);

const localValue = computed({
	get: () => props.modelValue,
	set: (value: boolean) => emits('update:modelValue', value),
});
</script>

<template>
	<div class="flex items-center gap-x-2">
		<Checkbox :id="props.name" v-model:checked="localValue" />
		<Label :for="props.name" class="text-sm">{{ props.label }}</Label>
	</div>
</template>
