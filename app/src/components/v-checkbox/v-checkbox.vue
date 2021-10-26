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
			<slot v-if="customValue === false">{{ label }}</slot>
			<input v-else v-model="internalValue" class="custom-input" />
		</span>
		<div v-if="$slots.append" class="append"><slot name="append" /></div>
	</component>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { useSync } from '@directus/shared/composables';

export default defineComponent({
	props: {
		value: {
			type: String,
			default: null,
		},
		modelValue: {
			type: [Boolean, Array],
			default: null,
		},
		label: {
			type: String,
			default: null,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		indeterminate: {
			type: Boolean,
			default: false,
		},
		iconOn: {
			type: String,
			default: 'check_box',
		},
		iconOff: {
			type: String,
			default: 'check_box_outline_blank',
		},
		iconIndeterminate: {
			type: String,
			default: 'indeterminate_check_box',
		},
		block: {
			type: Boolean,
			default: false,
		},
		customValue: {
			type: Boolean,
			default: false,
		},
		checked: {
			type: Boolean,
			default: null,
		},
	},
	emits: ['update:indeterminate', 'update:modelValue', 'update:value'],
	setup(props, { emit }) {
		const internalValue = useSync(props, 'value', emit);

		const isChecked = computed<boolean>(() => {
			if (props.checked !== null) return props.checked;

			if (props.modelValue instanceof Array) {
				return props.modelValue.includes(props.value);
			}

			return props.modelValue === true;
		});

		const icon = computed<string>(() => {
			if (props.indeterminate === true) return props.iconIndeterminate;
			if (props.checked === null && props.modelValue === null) return props.iconIndeterminate;

			return isChecked.value ? props.iconOn : props.iconOff;
		});

		return { isChecked, toggleInput, icon, internalValue };

		function toggleInput(): void {
			if (props.indeterminate === true) {
				emit('update:indeterminate', false);
			}

			if (props.modelValue instanceof Array) {
				const newValue = [...props.modelValue];

				if (props.modelValue.includes(props.value) === false) {
					newValue.push(props.value);
				} else {
					newValue.splice(newValue.indexOf(props.value), 1);
				}

				emit('update:modelValue', newValue);
			} else {
				emit('update:modelValue', !props.modelValue);
			}
		}
	},
});
</script>

<style>
body {
	--v-checkbox-color: var(--primary);
}
</style>

<style lang="scss" scoped>
@import '@/styles/mixins/no-wrap';

.v-checkbox {
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
		--v-icon-color: var(--foreground-subdued);

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

	&:not(:disabled):not(.indeterminate).checked {
		.checkbox {
			--v-icon-color: var(--v-checkbox-color);
		}

		.label {
			color: var(--foreground-normal);
		}

		&.block {
			.label {
				color: var(--v-checkbox-color);
			}

			&::before {
				opacity: 0.1;
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
