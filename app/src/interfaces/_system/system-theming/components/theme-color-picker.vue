<template>
	<div class="theme-color-picker" @click="activateColorPicker">
		<input
			ref="hiddenSourceInput"
			:value="inputValue"
			type="color"
			class="hidden-input"
			@input="emitUpdated(($event.target as HTMLInputElement).value)"
		/>
		<div
			class="theme-source-color-input"
			:style="{
				'background-color': inputValue || '#cccccc',
				//@ts-ignore
				'--red': inputAsRGB.r,
				'--green': inputAsRGB.g,
				'--blue': inputAsRGB.b,
			}"
		>
			<span class="hex-value">{{ inputValue }}</span>
		</div>
	</div>
</template>

<script lang="ts" setup>
import { Field, ValidationError } from '@directus/shared/types';
import { computed, ref, Ref } from 'vue';
import Color from 'color';

interface Props {
	modelValue: string;
	fieldData?: Field;
	disabled?: boolean;
	validationErrors?: ValidationError[];
	defaultValue?: string;
}
const props = withDefaults(defineProps<Props>(), {
	disabled: false,
	validationErrors: () => [],
	defaultValue: '',
	fieldData: undefined,
});

const emit = defineEmits(['update:modelValue']);

const hiddenSourceInput: Ref<HTMLInputElement | null> = ref(null);

const inputValue = computed(() => {
	return props.modelValue.toUpperCase();
});

const inputAsRGB = computed(() => Color(inputValue.value).rgb().object());

function emitUpdated(event: string) {
	emit('update:modelValue', event);
}

function activateColorPicker() {
	hiddenSourceInput.value!.click();
}
</script>

<style lang="scss" scoped>
.theme-color-picker {
	position: relative;
	border: var(--g-border-width) solid var(--g-color-border-normal);
	border-radius: var(--g-border-radius);
	overflow: hidden;
	cursor: pointer;
	transition: border-color var(--fast) var(--transition);
	.theme-source-color-input {
		display: grid;
		width: 100%;
		height: 48px;
		border: var(--g-border-width) solid var(--background-input);
		border-radius: calc(var(--g-border-radius) - 2px);
		align-content: center;
		justify-content: center;
		--r: calc(var(--red) * 0.299);
		--g: calc(var(--green) * 0.587);
		--b: calc(var(--blue) * 0.114);
		--sum: calc(var(--r) + var(--g) + var(--b));
		--perceived-lightness: calc(var(--sum) / 255);
		--threshold: 0.6;
		--offset: calc(var(--perceived-lightness) - var(--threshold));
		--extreme: calc(var(--offset) * -1000000000);
		--bool: clamp(0, var(--extreme), 1);
		.hex-value {
			margin-left: -1px;
			color: hsl(0, 0%, calc(100% * var(--bool)));
		}
	}
	&:hover {
		border-color: var(--g-color-border-accent);
		transition: border-color var(--fast) var(--transition);
	}
}
.hidden-input {
	width: 0;
	height: 0;
	visibility: hidden;
	position: absolute;
	top: 0;
	right: 0;
}
</style>
