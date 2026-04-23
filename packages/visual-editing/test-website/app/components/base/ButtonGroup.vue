<script setup lang="ts">
import { cn } from '@@/shared/utils';
import Button, { type ButtonProps } from './BaseButton.vue';

export interface ButtonGroupProps {
	buttons: Array<ButtonProps>;
	className?: string;
}

const props = defineProps<ButtonGroupProps>();

const containerClasses = computed(() => cn('flex gap-4', props.className));
</script>
<template>
	<div v-if="buttons?.length" :class="containerClasses">
		<Button v-for="(button, index) in buttons" :key="index" v-bind="button" />
	</div>
</template>
