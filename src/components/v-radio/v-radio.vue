<template>
	<button
		class="v-radio"
		type="button"
		:aria-pressed="isChecked ? 'true' : 'false'"
		:disabled="disabled"
		:class="{ checked: isChecked }"
		@click="emitValue"
	>
		<v-icon :name="icon" />
		<span class="label type-label">
			<slot name="label">{{ label }}</slot>
		</span>
	</button>
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';

export default defineComponent({
	model: {
		prop: 'inputValue',
		event: 'change',
	},
	props: {
		value: {
			type: String,
			required: true,
		},
		inputValue: {
			type: String,
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
	},
	setup(props, { emit }) {
		const isChecked = computed<boolean>(() => {
			return props.inputValue === props.value;
		});

		const icon = computed<string>(() => {
			return isChecked.value ? 'radio_button_checked' : 'radio_button_unchecked';
		});

		return { isChecked, emitValue, icon };

		function emitValue(): void {
			emit('change', props.value);
		}
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/no-wrap';

.v-radio {
	--v-radio-color: var(--primary);

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
		--v-icon-color: var(--border-normal);
	}

	&:disabled {
		cursor: not-allowed;

		.label {
			color: var(--foreground-subdued);
		}

		.v-icon {
			--v-icon-color: var(--border-normal);
		}
	}

	&:not(:disabled):hover {
		.v-icon {
			--v-icon-color: var(--border-normal);
		}
	}

	&:not(:disabled).checked {
		.v-icon {
			--v-icon-color: var(--v-radio-color);
		}
	}
}
</style>
