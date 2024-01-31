<script setup lang="ts">
import { cssVar } from '@directus/utils/browser';
import Color from 'color';
import { computed } from 'vue';
import { SetValueFn } from './types';

const props = defineProps<{
	rule: string;
	type: 'color';
	set: SetValueFn;
	path: string[];
	value: string | number | undefined;
	defaultValue: string | number;
}>();

const onInput = (event: Event) => {
	props.set(props.path, (event.target as HTMLInputElement).value);
};

const swatchValue = computed(() => {
	const value = props.value ?? props.defaultValue;

	if (typeof value !== 'string') return null;

	if (value.startsWith('var(--')) {
		// A var function that resolves to a color should be rendered directly.
		const result = cssVar(value.slice(4, -1));

		if (!result.startsWith('#')) {
			return null;
		}
	}

	return value;
});

const showSwatch = computed(() => {
	if (!swatchValue.value) return false;

	try {
		if (swatchValue.value.startsWith('var(--') || swatchValue.value.startsWith('color-mix(')) {
			/*
			 * var and color-mix are not supported by the color lib.
			 * We assume var has been validated by this point and can be directly rendered.
			 * By rendering the function directly we ensure reactivity for realtime changes.
			 */
			return true;
		}

		Color(swatchValue.value);
		return true;
	} catch {
		return false;
	}
});

const valueLength = computed(() => String(props.value ?? props.defaultValue).length + 0.5 + 'ch');
</script>

<template>
	<div class="rule" :class="{ 'has-value': !!value }">
		<p>{{ rule }}:</p>
		<input class="value" type="text" :value="value" :placeholder="String(defaultValue)" @input="onInput" />
		<div v-if="showSwatch" class="swatch"></div>
	</div>
</template>

<style scoped lang="scss">
.rule {
	display: flex;
	align-items: center;
	font-family: var(--theme--fonts--monospace--font-family);
	transition: color var(--fast) var(--transition);

	&.has-value {
		position: relative;

		&::before {
			content: '';
			width: 4px;
			height: 4px;
			background-color: var(--theme--form--field--input--foreground-subdued);
			border-radius: 4px;
			position: absolute;
			top: 11px;
			left: -10px;
			display: block;
		}
	}

	p {
		margin-right: 1ch;

		color: var(--theme--form--field--input--foreground);
	}

	.value {
		margin-right: 1ch;
		border: none;
		border-bottom: 1px solid var(--theme--form--field--input--border-color);
		min-width: 5ch;
		width: v-bind(valueLength);
		max-width: 100%;
		background: transparent;

		&::placeholder {
			color: var(--theme--form--field--input--foreground-subdued);
		}
	}

	.swatch {
		width: 1.2ch;
		height: 1.2ch;
		background-color: v-bind(swatchValue);
		border: 1px solid var(--theme--form--field--input--foreground);
	}
}
</style>
