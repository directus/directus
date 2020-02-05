<template>
	<button
		class="v-checkbox"
		@click="toggleInput"
		type="button"
		role="checkbox"
		:aria-pressed="isChecked ? 'true' : 'false'"
		:disabled="disabled"
	>
		<v-icon :name="icon" :color="iconColor" />
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
		color: {
			type: String,
			default: '--input-background-color-active'
		},
		disabled: {
			type: Boolean,
			default: false
		},
		indeterminate: {
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

		const icon = computed<string>(() => {
			if (props.indeterminate) return 'indeterminate_check_box';
			return isChecked.value ? 'check_box' : 'check_box_outline_blank';
		});

		const iconColor = computed<string>(() => {
			if (props.disabled) return '--input-background-color-disabled';
			if (isChecked.value) return props.color;
			return '--input-border-color';
		});

		return { isChecked, toggleInput, icon, iconColor };

		function toggleInput(): void {
			if (props.indeterminate) {
				emit('update:indeterminate', false);
			}

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
.v-checkbox {
	font-size: 0;
	appearance: none;
	background-color: transparent;
	border-radius: 0;
	border: none;
	display: flex;
	align-items: center;
	text-align: left;

	.label:not(:empty) {
		font-size: var(--input-font-size);
		margin-left: 8px;
		vertical-align: middle;
		white-space: nowrap;
		text-overflow: ellipsis;
		overflow: hidden;
	}

	&:disabled {
		cursor: not-allowed;

		.label {
			color: var(--popover-text-color-disabled);
		}
	}
}
</style>
