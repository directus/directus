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
import { defineComponent, computed } from '@vue/composition-api';
import parseCSSVar from '@/utils/parse-css-var';

export default defineComponent({
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
@import '@/styles/mixins/type-styles';

.v-switch {
	--v-switch-color: var(--input-foreground-color);

	display: flex;
	align-items: center;
	font-size: 0;
	background-color: transparent;
	border: none;
	border-radius: 0;
	appearance: none;

	.switch {
		position: relative;
		display: inline-block;
		width: 44px;
		height: 24px;
		vertical-align: middle;
		border: var(--input-border-width) solid var(--input-border-color);
		border-radius: 12px;
		transition: var(--fast) var(--transition);
		transition-property: background-color border;

		&:focus {
			outline: 0;
		}

		&::after {
			position: absolute;
			top: 2px;
			left: 2px;
			display: block;
			width: 16px;
			height: 16px;
			background-color: var(--input-border-color);
			border-radius: 8px;
			transition: transform var(--fast) var(--transition);
			content: '';
		}

		&:hover {
			border-color: var(--input-border-color-hover);
		}
	}

	&[aria-pressed='true'] .switch {
		background-color: var(--v-switch-color);
		border-color: var(--v-switch-color);

		&::after {
			background-color: var(--background-color);
			transform: translateX(20px);
		}
	}

	.label:not(:empty) {
		margin-left: 8px;
		vertical-align: middle;

		@include type-body-sans;
	}

	&:disabled {
		cursor: not-allowed;

		.switch {
			background-color: var(--input-background-color-disabled);
			border-color: var(--input-border-color);

			&::after {
				background-color: var(--input-border-color);
			}

			&:hover {
				border-color: var(--input-border-color);
			}
		}

		.label {
			color: var(--foreground-color-secondary);
		}
	}
}
</style>
