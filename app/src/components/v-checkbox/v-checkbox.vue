<template>
	<component
		:is="customValue ? 'div' : 'button'"
		class="v-checkbox"
		@click="toggleInput"
		type="button"
		role="checkbox"
		:aria-pressed="isChecked ? 'true' : 'false'"
		:disabled="disabled"
		:class="{ checked: isChecked, indeterminate, block }"
	>
		<div class="prepend" v-if="$scopedSlots.prepend"><slot name="prepend" /></div>
		<v-icon class="checkbox" :name="icon" @click.stop="toggleInput" :disabled="disabled" />
		<span class="label type-text">
			<slot v-if="customValue === false">{{ label }}</slot>
			<input @click.stop class="custom-input" v-else v-model="_value" />
		</span>
		<div class="append" v-if="$scopedSlots.append"><slot name="append" /></div>
	</component>
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';
import useSync from '@/composables/use-sync';

export default defineComponent({
	model: {
		prop: 'inputValue',
		event: 'change',
	},
	props: {
		value: {
			type: String,
			default: null,
		},
		inputValue: {
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
	},
	setup(props, { emit }) {
		const _value = useSync(props, 'value', emit);

		const isChecked = computed<boolean>(() => {
			if (props.inputValue instanceof Array) {
				return props.inputValue.includes(props.value);
			}

			return props.inputValue === true;
		});

		const icon = computed<string>(() => {
			if (props.indeterminate === true) return props.iconIndeterminate;
			return isChecked.value ? props.iconOn : props.iconOff;
		});

		return { isChecked, toggleInput, icon, _value };

		function toggleInput(): void {
			if (props.indeterminate === true) {
				emit('update:indeterminate', false);
			}

			if (props.inputValue instanceof Array) {
				const newValue = [...props.inputValue];

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

	&:not(:disabled):hover {
		.checkbox {
			--v-icon-color: var(--primary);
		}
		&.block {
			border-color: var(--border-normal-alt);
			background-color: var(--background-subdued);
		}
	}

	&.block {
		transition: all var(--fast) var(--transition);
		position: relative;
		width: 100%;
		height: var(--input-height);
		padding: 10px; // 14 - 4 (border)
		border: 2px solid var(--border-normal);
		border-radius: var(--border-radius);

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

		input {
			//
		}
	}

	.prepend,
	.append {
		display: contents;
		font-size: 1rem;
	}
}
</style>
