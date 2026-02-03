<script setup lang="ts">
import { computed } from 'vue';

interface Props {
	/** Disables the input */
	disabled?: boolean;
	/** Set the non-editable state for the input */
	nonEditable?: boolean;
	/** Autofocusses the input on render */
	autofocus?: boolean;
	/** Render the input with 100% width */
	fullWidth?: boolean;
	/** Model the text inside the input */
	modelValue?: string;
	/** If the input is empty, return `null` instead of `''` */
	nullable?: boolean;
	/** Renders the textarea at regular input size, and expands to max-block-size on focus */
	expandOnFocus?: boolean;
	/** Text to show when no input is entered */
	placeholder?: string;
	/** Trim leading and trailing whitespace */
	trim?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	disabled: false,
	nonEditable: false,
	autofocus: false,
	fullWidth: true,
	modelValue: undefined,
	nullable: true,
	expandOnFocus: false,
	placeholder: undefined,
	trim: false,
});

const emit = defineEmits(['update:modelValue']);

const listeners = computed(() => ({
	input: emitValue,
	blur: trimIfEnabled,
}));

const hasContent = computed(() => props.modelValue && props.modelValue.length > 0);

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

<template>
	<div
		class="v-textarea"
		:class="{
			disabled,
			'non-editable': nonEditable,
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

<style lang="scss" scoped>
/*

	Available Variables:

		--v-textarea-font-family  [var(--theme--fonts--sans--font-family)]

*/

.v-textarea {
	position: relative;
	display: flex;
	flex-direction: column;
	inline-size: max-content;
	block-size: var(--input-height-md);
	background-color: var(--theme--form--field--input--background);
	border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
	border-radius: var(--theme--border-radius);
	transition: var(--fast) var(--transition);
	transition-property: border-color, box-shadow;
	box-shadow: var(--theme--form--field--input--box-shadow);

	.append,
	.prepend {
		flex-shrink: 0;
	}

	&.expand-on-focus {
		block-size: var(--theme--form--field--input--height);
		transition: block-size var(--medium) var(--transition);

		.append,
		.prepend {
			opacity: 0;
			transition: opacity var(--medium) var(--transition);
			pointer-events: none;
		}

		&:focus,
		&:focus-within,
		&.has-content {
			block-size: var(--v-textarea-max-height);

			.append,
			.prepend {
				opacity: 1;
				pointer-events: auto;
			}
		}
	}

	&.full-width {
		inline-size: 100%;
	}

	&:hover:not(.disabled) {
		border-color: var(--theme--form--field--input--border-color-hover);
		box-shadow: var(--theme--form--field--input--box-shadow-hover);
	}

	&:focus:not(.disabled),
	&:focus-within:not(.disabled) {
		border-color: var(--theme--form--field--input--border-color-focus);
		box-shadow: var(--theme--form--field--input--box-shadow-focus);
	}

	textarea {
		position: relative;
		display: block;
		flex-grow: 1;
		inline-size: 100%;
		block-size: var(--theme--form--field--input--height);
		padding: var(--theme--form--field--input--padding);
		color: var(--theme--foreground);
		font-family: var(--v-textarea-font-family, var(--theme--fonts--sans--font-family));
		background-color: transparent;
		border: 0;
		resize: none;

		&::placeholder {
			color: var(--theme--foreground-subdued);
		}
	}

	&.disabled:not(.non-editable) {
		background-color: var(--theme--form--field--input--background-subdued);

		textarea {
			color: var(--theme--foreground-subdued);
		}
	}
}
</style>
