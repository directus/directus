<template>
	<button
		class="v-checkbox"
		@click="toggleInput"
		type="button"
		role="checkbox"
		:aria-pressed="isChecked ? 'true' : 'false'"
		:disabled="disabled"
		:class="{ checked: isChecked }"
	>
		<v-icon :name="icon" />
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

		return { isChecked, toggleInput, icon };

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
	--v-checkbox-color: var(--input-background-color-active);

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
		overflow: hidden;
		font-size: var(--input-font-size);
		white-space: nowrap;
		text-overflow: ellipsis;
		vertical-align: middle;
	}

	& .v-icon {
		--v-icon-color: var(--input-border-color);
	}

	&:disabled {
		cursor: not-allowed;

		.label {
			color: var(--popover-text-color-disabled);
		}

		.v-icon {
			--v-icon-color: var(--input-border-color);
		}
	}

	&:not(:disabled).checked {
		.v-icon {
			--v-icon-color: var(--v-checkbox-color);
		}
	}
}
</style>
