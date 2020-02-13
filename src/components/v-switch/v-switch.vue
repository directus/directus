<template>
	<button
		class="v-switch"
		@click="toggleInput"
		type="button"
		role="switch"
		:aria-pressed="isChecked ? 'true' : 'false'"
		:disabled="disabled"
	>
		<span class="switch" />
		<span class="label">
			<slot name="label">{{ label }}</slot>
		</span>
	</button>
</template>

<script lang="ts">
import { createComponent, computed } from '@vue/composition-api';
import parseCSSVar from '@/utils/parse-css-var';

export default createComponent({
	model: {
		prop: 'inputValue',
		event: 'change'
	},
	props: {
		value: {
			type: String,
			default: null
		},
		inputValue: {
			type: [Boolean, Array],
			default: false
		},
		label: {
			type: String,
			default: null
		},
		disabled: {
			type: Boolean,
			default: false
		}
	},
	setup(props, { emit }) {
		const isChecked = computed<boolean>(() => {
			if (props.inputValue instanceof Array) {
				return props.inputValue.includes(props.value);
			}

			return props.inputValue === true;
		});

		return { isChecked, toggleInput };

		function toggleInput(): void {
			if (props.inputValue instanceof Array) {
				let newValue = [...props.inputValue];

				if (isChecked.value === false) {
					newValue.push(props.value);
				} else {
					newValue.splice(newValue.indexOf(props.value), 1);
				}

				emit('change', newValue);
			} else {
				emit('change', !isChecked.value);
			}
		}
	}
});
</script>

<style lang="scss" scoped>
.v-switch {
	--v-switch-color: var(--input-background-color-active);

	font-size: 0;
	appearance: none;
	background-color: transparent;
	border-radius: 0;
	border: none;
	display: flex;
	align-items: center;

	.switch {
		display: inline-block;
		height: 24px;
		width: 44px;
		border-radius: 12px;
		border: var(--input-border-width) solid var(--input-border-color);
		position: relative;
		transition: var(--fast) var(--transition);
		transition-property: background-color border;
		vertical-align: middle;

		&:not(:disabled)hover {
			border-color: var(--input-border-color-hover);
		}

		&:focus {
			outline: 0;
		}

		&::after {
			content: '';
			width: 16px;
			height: 16px;
			position: absolute;
			top: 2px;
			left: 2px;
			display: block;
			background-color: var(--input-border-color);
			border-radius: 8px;
			transition: transform var(--fast) var(--transition);
		}
	}

	&[aria-pressed='true'] {
		&:not(:disabled) {
			.switch {
				background-color: var(--v-switch-color);
				border-color: var(--v-switch-color);

				&::after {
					background-color: var(--input-text-color-active);
				}
			}
		}

		.switch::after {
			transform: translateX(20px);
		}
	}

	.label:not(:empty) {
		font-size: var(--input-font-size);
		margin-left: 8px;
		vertical-align: middle;
	}

	&:disabled {
		cursor: not-allowed;

		.switch {
			background-color: var(--input-background-color-disabled);
		}

		.label {
			color: var(--popover-text-color-disabled);
		}
	}
}
</style>
