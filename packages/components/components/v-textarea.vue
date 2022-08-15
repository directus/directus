<template>
	<div
		class="v-textarea"
		:class="{
			disabled,
			'expand-on-focus': expandOnFocus,
			'full-width': fullWidth,
			'has-content': hasContent,
		}"
	>
		<div v-if="$slots.prepend" class="prepend"><slot name="prepend" /></div>
		<textarea
			v-focus="autofocus"
			v-bind="$attrs"
			:placeholder="placeholder"
			:disabled="disabled"
			:value="modelValue"
			v-on="listeners"
		/>
		<div v-if="$slots.append" class="append"><slot name="append" /></div>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
	disabled?: boolean;
	autofocus?: boolean;
	fullWidth?: boolean;
	modelValue?: string;
	nullable?: boolean;
	expandOnFocus?: boolean;
	placeholder?: string;
	trim?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	disabled: false,
	autofocus: false,
	fullWidth: true,
	nullable: true,
	expandOnFocus: false,
	trim: false,
});

const emit = defineEmits(['update:modelValue']);

const listeners = computed(() => ({
	input: emitValue,
	blur: trimIfEnabled,
}));

const hasContent = computed(() => props.modelValue && props.modelValue.length > 0);

return { listeners, hasContent };

function emitValue(event: InputEvent) {
	const value = (event.target as HTMLInputElement).value;

	if (props.nullable === true && value === '') {
		emit('update:modelValue', null);
	} else {
		emit('update:modelValue', value);
	}
}

function trimIfEnabled() {
	if (props.modelValue && props.trim) {
		emit('update:modelValue', props.modelValue.trim());
	}
}
</script>

<style>
body {
	--v-textarea-min-height: none;
	--v-textarea-max-height: var(--input-height-tall);
	--v-textarea-height: var(--input-height-tall);
	--v-textarea-font-family: var(--family-sans-serif);
}
</style>

<style lang="scss" scoped>
.v-textarea {
	position: relative;
	display: flex;
	flex-direction: column;
	width: max-content;
	height: var(--v-textarea-height);
	min-height: var(--v-textarea-min-height);
	max-height: var(--v-textarea-max-height);
	background-color: var(--background-input);
	border: var(--border-width) solid var(--border-normal);
	border-radius: var(--border-radius);
	transition: border-color var(--fast) var(--transition);

	.append,
	.prepend {
		flex-shrink: 0;
	}

	&.expand-on-focus {
		height: var(--input-height);
		transition: height var(--medium) var(--transition);

		.append,
		.prepend {
			opacity: 0;
			transition: opacity var(--medium) var(--transition);
			pointer-events: none;
		}

		&:focus,
		&:focus-within,
		&.has-content {
			height: var(--v-textarea-max-height);

			.append,
			.prepend {
				opacity: 1;
				pointer-events: auto;
			}
		}
	}

	&.full-width {
		width: 100%;
	}

	&:hover:not(.disabled) {
		border-color: var(--border-normal-alt);
	}

	&:focus:not(.disabled),
	&:focus-within:not(.disabled) {
		border-color: var(--primary);
		box-shadow: 0 0 16px -8px var(--primary);
	}

	textarea {
		position: relative;
		display: block;
		flex-grow: 1;
		width: 100%;
		height: var(--input-height);
		padding: var(--input-padding);
		color: var(--foreground-normal);
		font-family: var(--v-textarea-font-family);
		background-color: transparent;
		border: 0;
		resize: none;

		&::placeholder {
			color: var(--foreground-subdued);
		}
	}

	&.disabled textarea {
		color: var(--foreground-subdued);
		background-color: var(--background-subdued);
	}
}
</style>
