<template>
	<button
		class="v-radio"
		type="button"
		:aria-pressed="isChecked ? 'true' : 'false'"
		:disabled="disabled"
		:class="{ checked: isChecked, block }"
		@click="emitValue"
	>
		<v-icon :name="icon" />
		<span class="label type-text">
			<slot name="label">{{ label }}</slot>
		</span>
	</button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
	/** What value to represent when selected */
	value: string | number;
	/** If `value` and `modelValue` match, the radio is selected */
	modelValue?: string | number | null;
	/** Label to render next to the radio */
	label?: string | null;
	/** Disable the radio button */
	disabled?: boolean;
	/** Change the icon to display when enabled */
	iconOn?: string;
	/** Change the icon to display when disabled */
	iconOff?: string;
	/** Render the radio in a block like style */
	block?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	modelValue: null,
	label: null,
	disabled: false,
	iconOn: 'radio_button_checked',
	iconOff: 'radio_button_unchecked',
	block: false,
});

const emit = defineEmits(['update:modelValue']);

const isChecked = computed<boolean>(() => {
	return props.modelValue === props.value;
});

const icon = computed<string>(() => {
	return isChecked.value ? props.iconOn : props.iconOff;
});

function emitValue(): void {
	emit('update:modelValue', props.value);
}
</script>

<style>
body {
	--v-radio-color: var(--primary);
}
</style>

<style lang="scss" scoped>
@import '@/styles/mixins/no-wrap';

.v-radio {
	display: flex;
	align-items: center;
	font-size: 0;
	text-align: left;
	background-color: transparent;
	border: none;
	border-radius: 0;
	appearance: none;

	.label:not(:empty) {
		margin-left: 8px;

		@include no-wrap;
	}

	& .v-icon {
		--v-icon-color: var(--foreground-subdued);
	}

	&:disabled {
		cursor: not-allowed;

		.label {
			color: var(--foreground-subdued);
		}

		.v-icon {
			--v-icon-color: var(--foreground-subdued);
		}
	}

	&.block {
		position: relative;
		width: 100%;
		height: var(--input-height);
		padding: 10px; // 14 - 4 (border)
		border: 2px solid var(--background-subdued);
		border-radius: var(--border-radius);

		&::before {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background-color: var(--background-subdued);
			border-radius: var(--border-radius);
			content: '';
		}

		.label {
			z-index: 1;
		}
	}

	&:not(:disabled):hover {
		.v-icon {
			--v-icon-color: var(--foreground-subdued);
		}
	}

	&:not(:disabled).checked {
		.v-icon {
			--v-icon-color: var(--v-radio-color);
		}

		&.block {
			border-color: var(--v-radio-color);

			.label {
				color: var(--v-radio-color);
			}

			&::before {
				background-color: var(--v-radio-color);
				opacity: 0.1;
			}
		}
	}
}
</style>
