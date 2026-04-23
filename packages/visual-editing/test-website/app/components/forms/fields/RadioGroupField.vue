<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
	modelValue: string;
	name: string;
	options: { value: string; text: string }[];
}>();

const emits = defineEmits(['update:modelValue']);

const localValue = computed({
	get: () => props.modelValue,
	set: (value: string) => emits('update:modelValue', value),
});
</script>

<template>
	<RadioGroup v-model="localValue">
		<div v-for="option in props.options" :key="option.value" class="flex items-center gap-x-2">
			<RadioGroupItem :id="`${props.name}-${option.value}`" :value="option.value" />
			<Label :for="`${props.name}-${option.value}`" class="text-sm">
				{{ option.text }}
			</Label>
		</div>
	</RadioGroup>
</template>
