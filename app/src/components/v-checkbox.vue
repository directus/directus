<script setup lang="ts">
import { computed, onMounted, useTemplateRef } from 'vue';
import { useSync } from '@directus/composables';

interface Props {
	/** If the `modelValue` is an array of strings, activates the checkbox if the value is inside it */
	value?: string | null;
	/** Used to model the active state */
	modelValue?: boolean | string[] | null;
	/** Label for the checkbox */
	label?: string | null;
	/** Disable the checkbox */
	disabled?: boolean;
	/** Set the non-editable state for the checkbox */
	nonEditable?: boolean;
	/** Renders the checkbox neither selected nor unselected */
	indeterminate?: boolean;
	/** What icon to use for the on state */
	iconOn?: string;
	/** What icon to use for the off state */
	iconOff?: string;
	/** What icon to use for the indeterminate state */
	iconIndeterminate?: string;
	/** Show as styled block. Matches input size */
	block?: boolean;
	/** If a custom value can be entered next to it */
	customValue?: boolean;
	/** Will focus the custom value input on mounted */
	autofocusCustomInput?: boolean;
	/** TODO: What the? */
	checked?: boolean | null;
}

const props = withDefaults(defineProps<Props>(), {
	value: null,
	modelValue: null,
	label: null,
	disabled: false,
	nonEditable: false,
	indeterminate: false,
	iconOn: 'check_box',
	iconOff: 'check_box_outline_blank',
	iconIndeterminate: 'indeterminate_check_box',
	block: false,
	customValue: false,
	checked: null,
});

const emit = defineEmits(['update:indeterminate', 'update:modelValue', 'update:value', 'blur:custom-input']);

const internalValue = useSync(props, 'value', emit);

const isChecked = computed<boolean>(() => {
	if (props.checked !== null) return props.checked;

	if (props.modelValue instanceof Array) {
		if (!props.value) return false;

		return props.modelValue.includes(props.value);
	}

	return props.modelValue === true;
});

const icon = computed<string>(() => {
	if (props.indeterminate === true) return props.iconIndeterminate;
	if (props.checked === null && props.modelValue === null) return props.iconIndeterminate;

	return isChecked.value ? props.iconOn : props.iconOff;
});

const customInput = useTemplateRef<HTMLInputElement>('custom-input');

onMounted(() => {
	if (props.autofocusCustomInput && props.customValue) {
		customInput.value?.focus();
	}
});

function toggleInput(): void {
	if (props.disabled) return;

	if (props.indeterminate === true) {
		emit('update:indeterminate', false);
	}

	if (props.modelValue instanceof Array) {
		if (props.value) {
			const newValue = [...props.modelValue];

			if (!props.modelValue.includes(props.value)) {
				newValue.push(props.value);
			} else {
				newValue.splice(newValue.indexOf(props.value), 1);
			}

			emit('update:modelValue', newValue);
		}
	} else {
		emit('update:modelValue', !props.modelValue);
	}
}

function onClickIcon(e: MouseEvent): void {
	if (!props.customValue) return;
	e.stopPropagation();
	toggleInput();
}
</script>

<template>
	<component
		:is="customValue ? 'div' : 'button'"
		class="v-checkbox"
		type="button"
		role="checkbox"
		:aria-pressed="isChecked ? 'true' : 'false'"
		:disabled="disabled && !customValue"
		:class="{ checked: isChecked, indeterminate, block }"
		@click.stop="toggleInput"
	>
		<div v-if="$slots.prepend" class="prepend"><slot name="prepend" /></div>
		<v-icon class="checkbox" :name="icon" :disabled :clickable="customValue" @click="onClickIcon" />
		<span class="label type-text">
			<slot v-if="!customValue">{{ label }}</slot>
			<input
				v-else
				ref="custom-input"
				v-model="internalValue"
				type="text"
				class="custom-input"
				:disabled
				@click.stop
				@blur="$emit('blur:custom-input')"
			/>
		</span>
		<div v-if="$slots.append" class="append"><slot name="append" /></div>
	</component>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';

/*

	Available Variables:

		--v-checkbox-color            [var(--theme--primary)]
		--v-checkbox-unchecked-color  [var(--theme--foreground-subdued)]

*/

.v-checkbox {
	--v-icon-color: var(--v-checkbox-unchecked-color, var(--theme--foreground-subdued));
	--v-icon-color-hover: var(--theme--primary);

	position: relative;
	display: flex;
	align-items: center;
	font-size: 0;
	text-align: start;
	background-color: transparent;
	border: none;
	border-radius: 0;
	appearance: none;

	.label:not(:empty) {
		flex-grow: 1;
		margin-inline-start: 8px;
		transition: color var(--fast) var(--transition);
		@include mixins.no-wrap;

		input {
			inline-size: 100%;
			background-color: transparent;
			border: none;
			border-block-end: 2px solid var(--theme--form--field--input--border-color);
			border-radius: 0;
		}
	}

	& .checkbox {
		--v-icon-color: var(--v-checkbox-unchecked-color, var(--theme--foreground-subdued));

		transition: color var(--fast) var(--transition);
	}

	&:disabled {
		cursor: not-allowed;

		.label {
			color: var(--form--field--disabled--primary, var(--theme--foreground-subdued));
		}

		.checkbox {
			--v-icon-color: var(--form--icon--disabled, var(--theme--foreground-subdued));
		}
	}

	&.block {
		--focus-ring-offset: var(--focus-ring-offset-invert);

		position: relative;
		inline-size: 100%;
		block-size: var(--theme--form--field--input--height);
		padding: 10px; // 14 - 4 (border)
		background-color: var(--theme--form--field--input--background);
		border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
		border-radius: var(--theme--border-radius);
		transition: all var(--fast) var(--transition);

		&:disabled {
			background-color: var(
				--form--field--input--disabled--background,
				var(--theme--form--field--input--background-subdued)
			);
		}

		&::before {
			position: absolute;
			inset-block-start: 0;
			inset-inline-start: 0;
			z-index: 0;
			inline-size: 100%;
			block-size: 100%;
			border-radius: var(--theme--border-radius);
			content: '';
		}

		> * {
			z-index: 1;
		}
	}

	&:not(:disabled):hover {
		.checkbox {
			--v-icon-color: var(--theme--primary);
		}

		&.block {
			border-color: var(--theme--form--field--input--border-color-hover);
		}
	}

	&:not(:disabled):not(.indeterminate) {
		.label {
			color: var(--theme--foreground);
		}

		&.block {
			&::before {
				opacity: 0.1;
			}
		}
	}

	&:not(:disabled:not(.non-editable)):not(.indeterminate).checked {
		.checkbox {
			--v-icon-color: var(--v-checkbox-color, var(--theme--primary));
		}

		&.block {
			.label {
				color: var(--v-checkbox-color, var(--theme--primary));
			}
		}
	}

	.prepend,
	.append {
		display: contents;
		font-size: 1rem;
	}

	.append {
		margin-inline-start: 8px;
	}
}
</style>
