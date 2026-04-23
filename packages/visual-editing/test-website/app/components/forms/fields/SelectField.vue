<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
	modelValue: string;
	name: string;
	options?: { value: string; text: string }[];
	placeholder?: string;
}>();

const emits = defineEmits(['update:modelValue']);

const localValue = computed({
	get: () => props.modelValue,
	set: (value: string) => emits('update:modelValue', value),
});
</script>

<template>
	<Select v-model="localValue">
		<SelectTrigger :id="props.name">
			<SelectValue :placeholder="props.placeholder || 'Select an option'" />
		</SelectTrigger>
		<SelectContent>
			<SelectGroup>
				<SelectItem v-for="option in props.options ?? []" :key="option.value" :value="option.value">
					{{ option.text }}
				</SelectItem>
			</SelectGroup>
		</SelectContent>
	</Select>
</template>
