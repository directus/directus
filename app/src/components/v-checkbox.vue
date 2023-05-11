<template>
	<component
		:is="customValue ? 'div' : 'button'"
		class="v-checkbox"
		type="button"
		role="checkbox"
		:aria-pressed="isChecked ? 'true' : 'false'"
		:disabled="disabled"
		:class="{ checked: isChecked, indeterminate, block }"
		@click.stop="toggleInput"
	>
		<div v-if="$slots.prepend" class="prepend"><slot name="prepend" /></div>
		<v-icon class="checkbox" :name="icon" :disabled="disabled" />
		<span class="label type-text">
			<slot v-if="!customValue">{{ label }}</slot>
			<input v-else v-model="internalValue" class="custom-input" @click.stop="" />
		</span>
		<div v-if="$slots.append" class="append"><slot name="append" /></div>
	</component>
</template>

<script setup lang="ts">
import { computed } from 'vue';
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
	/** TODO: What the? */
	checked?: boolean | null;
}

const props = withDefaults(defineProps<Props>(), {
	value: null,
	modelValue: null,
	label: null,
	disabled: false,
	indeterminate: false,
	iconOn: 'check_box',
	iconOff: 'check_box_outline_blank',
	iconIndeterminate: 'indeterminate_check_box',
	block: false,
	customValue: false,
	checked: null,
});

const emit = defineEmits(['update:indeterminate', 'update:modelValue', 'update:value']);

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
</script>

<style>
body {
	--v-checkbox-color: var(--primary);
	--v-checkbox-unchecked-color: var(--foreground-subdued);
}
</style>

<style lang="scss" scoped>
@import '@/styles/mixins/no-wrap';

.v-checkbox {
	--v-icon-color: var(--v-checkbox-unchecked-color);
	--v-icon-color-hover: var(--primary);

	position: relative;
	display: flex;
	align-items: center;
	font-size: 0;
	text-align: left;
	background-color: transparent;
	border: none;
	border-radius: 0;
	appearance: none;

	.label:not(:empty) {
		flex-grow: 1;
		margin-left: 8px;
		transition: color var(--fast) var(--transition);

		input {
			width: 100%;
			background-color: transparent;
			border: none;
			border-bottom: 2px solid var(--border-normal);
			border-radius: 0;
		}

		@include no-wrap;
	}

	& .checkbox {
		--v-icon-color: var(--v-checkbox-unchecked-color);

		transition: color var(--fast) var(--transition);
	}

	&:disabled {
		cursor: not-allowed;

		.label {
			color: var(--foreground-subdued);
		}

		.checkbox {
			--v-icon-color: var(--foreground-subdued);
		}
	}

	&.block {
		position: relative;
		width: 100%;
		height: var(--input-height);
		padding: 10px; // 14 - 4 (border)
		background-color: var(--background-page);
		border: var(--border-width) solid var(--border-normal);
		border-radius: var(--border-radius);
		transition: all var(--fast) var(--transition);

		&:disabled {
			background-color: var(--background-subdued);
		}

		&::before {
			position: absolute;
			top: 0;
			left: 0;
			z-index: 0;
			width: 100%;
			height: 100%;
			border-radius: var(--border-radius);
			content: '';
		}

		> * {
			z-index: 1;
		}
	}

	&:not(:disabled):hover {
		.checkbox {
			--v-icon-color: var(--primary);
		}

		&.block {
			background-color: var(--background-subdued);
			border-color: var(--border-normal-alt);
		}
	}

	&:not(:disabled):not(.indeterminate) {
		.label {
			color: var(--foreground-normal);
		}

		&.block {
			&::before {
				opacity: 0.1;
			}
		}
	}

	&:not(:disabled):not(.indeterminate).checked {
		.checkbox {
			--v-icon-color: var(--v-checkbox-color);
		}

		&.block {
			.label {
				color: var(--v-checkbox-color);
			}
		}
	}

	.prepend,
	.append {
		display: contents;
		font-size: 1rem;
	}
}
</style>
