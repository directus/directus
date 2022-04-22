<template>
	<button
		class="v-switch"
		type="button"
		role="switch"
		:aria-pressed="isChecked ? 'true' : 'false'"
		:disabled="disabled"
		@click="toggleInput"
	>
		<span class="switch" />
		<span class="label type-label">
			<slot name="label">{{ label }}</slot>
		</span>
	</button>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';

export default defineComponent({
	props: {
		value: {
			type: String,
			default: null,
		},
		modelValue: {
			type: [Boolean, Array],
			default: false,
		},
		label: {
			type: String,
			default: null,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update:modelValue'],
	setup(props, { emit }) {
		const isChecked = computed<boolean>(() => {
			if (props.modelValue instanceof Array) {
				return props.modelValue.includes(props.value);
			}

			return props.modelValue === true;
		});

		return { isChecked, toggleInput };

		function toggleInput(): void {
			if (props.modelValue instanceof Array) {
				const newValue = [...props.modelValue];

				if (isChecked.value === false) {
					newValue.push(props.value);
				} else {
					newValue.splice(newValue.indexOf(props.value), 1);
				}

				emit('update:modelValue', newValue);
			} else {
				emit('update:modelValue', !isChecked.value);
			}
		}
	},
});
</script>

<style>
body {
	--v-switch-color: var(--foreground-normal);
}
</style>

<style lang="scss" scoped>
.v-switch {
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
		border: var(--border-width) solid var(--border-normal);
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
			background-color: var(--border-normal);
			border-radius: 8px;
			transition: transform var(--fast) var(--transition);
			content: '';
		}

		&:hover {
			border-color: var(--border-normal);
		}
	}

	&[aria-pressed='true'] .switch {
		background-color: var(--v-switch-color);
		border-color: var(--v-switch-color);

		&::after {
			background-color: var(--background-page);
			transform: translateX(20px);
		}
	}

	.label:not(:empty) {
		margin-left: 8px;
		vertical-align: middle;
	}

	&:disabled {
		cursor: not-allowed;

		.switch {
			background-color: var(--background-normal-alt);
			border-color: var(--border-normal);

			&::after {
				background-color: var(--border-normal);
			}

			&:hover {
				border-color: var(--border-normal);
			}
		}

		.label {
			color: var(--foreground-subdued);
		}
	}
}
</style>
