<template>
	<div ref="wrapper" class="v-date-picker">
		<input type="text" data-input />
		<button type="button" data-clear>
			<v-icon :name="modelValue ? 'close' : 'today'" :class="{ active: isDatePickerOpen }" />
		</button>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, ref, onMounted, onBeforeUnmount, computed, PropType } from 'vue';
import Flatpickr from 'flatpickr';

export default defineComponent({
	props: {
		value: {
			type: String,
			default: null,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		type: {
			type: String as PropType<'timestamp' | 'dateTime' | 'time' | 'date'>,
			required: true,
			validator: (val: string) => ['dateTime', 'date', 'time', 'timestamp'].includes(val),
		},
		includeSeconds: {
			type: Boolean,
			default: false,
		},
		use24: {
			type: Boolean,
			default: true,
		},
	},
	emits: ['update:modelValue'],
	setup(props, { emit }) {
		const { t } = useI18n();

		const wrapper = ref<Node | null>(null);
		let flatpickr: Flatpickr.Instance | null;

		const isDatePickerOpen = ref<boolean>(false);
		const modelValue = ref<Date | null>(null);

		onMounted(() => {
			if (wrapper.value) {
				flatpickr = Flatpickr(wrapper.value, flatpickrOptions.value);
			}
		});

		onBeforeUnmount(() => {
			if (flatpickr) {
				flatpickr.destroy();
				flatpickr = null;
			}
		});

		const defaultOptions = {
			altInput: true,
			nextArrow:
				'<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6-6-6z"/></svg>',
			prevArrow:
				'<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12l4.58-4.59z"/></svg>',
			wrap: true,

			onChange(selectedDates: Date[], dateStr: string, instance: Flatpickr.Instance) {
				const selectedDate = selectedDates.length > 0 ? selectedDates[0] : null;
				modelValue.value = selectedDate;
				emit('update:modelValue', selectedDate);
			},
			onClose() {
				isDatePickerOpen.value = false;
			},
			onOpen() {
				isDatePickerOpen.value = true;
			},
		};

		const flatpickrOptions = computed<Record<string, any>>(() => {
			return Object.assign({}, defaultOptions, {
				enableSeconds: props.includeSeconds,
				enableTime: ['dateTime', 'time', 'timestamp'].includes(props.type),
				noCalendar: props.type === 'time',
				time_24hr: props.use24,
			});
		});

		return { t, wrapper, modelValue, isDatePickerOpen };
	},
});
</script>

<style>
@import 'flatpickr/dist/flatpickr.css';
@import './flatpickr-overrides.css';
</style>

<style lang="scss" scoped>
.v-date-picker {
	--arrow-color: var(--border-normal);
	--v-icon-color: var(--foreground-subdued);
	--v-input-color: var(--foreground-normal);
	--v-input-background-color: var(--background-input);
	--v-input-border-color-focus: var(--primary);

	// width: max-content;

	position: relative;
	display: flex;
	flex-grow: 1;
	align-items: center;
	height: var(--input-height);
	padding: var(--input-padding);
	padding-top: 0px;
	padding-bottom: 0px;
	color: var(--v-input-color);
	font-family: var(--v-input-font-family);
	background-color: var(--v-input-background-color);
	border: var(--border-width) solid var(--border-normal);
	border-radius: var(--border-radius);
	transition: border-color var(--fast) var(--transition);

	.prepend {
		margin-right: 8px;
	}

	.step-up {
		margin-bottom: -8px;
	}

	.step-down {
		margin-top: -8px;
	}

	.step-up,
	.step-down {
		--v-icon-color: var(--arrow-color);

		display: block;

		&:hover:not(.disabled) {
			--arrow-color: var(--primary);
		}

		&:active:not(.disabled) {
			transform: scale(0.9);
		}

		&.disabled {
			--arrow-color: var(--border-normal);

			cursor: auto;
		}
	}

	&:hover {
		--arrow-color: var(--border-normal-alt);

		color: var(--v-input-color);
		background-color: var(--background-input);
		border-color: var(--border-normal-alt);
	}

	&:focus-within,
	&.active {
		--arrow-color: var(--border-normal-alt);

		color: var(--v-input-color);
		background-color: var(--background-input);
		border-color: var(--v-input-border-color-focus);
	}

	&.disabled {
		--arrow-color: var(--border-normal);

		color: var(--foreground-subdued);
		background-color: var(--background-subdued);
		border-color: var(--border-normal);
	}

	.prefix,
	.suffix {
		color: var(--foreground-subdued);
	}

	.append {
		flex-shrink: 0;
		margin-left: 8px;
	}

	:deep(.input) {
		flex-grow: 1;
		// width: 20px; // allows flex to grow/shrink to allow for slots
		height: 100%;
		padding: var(--input-padding);
		padding-right: 0px;
		padding-left: 0px;
		font-family: var(--v-input-font-family);
		background-color: transparent;
		border: none;
		appearance: none;

		&::placeholder {
			color: var(--v-input-placeholder-color);
		}

		&::-webkit-outer-spin-button,
		&::-webkit-inner-spin-button {
			margin: 0;
			appearance: none;
		}

		&:focus {
			border-color: var(--v-input-border-color-focus);
		}

		/* Firefox */

		&[type='number'] {
			appearance: textfield;
		}
	}

	&.full-width {
		width: 100%;

		.input {
			width: 100%;
		}
	}

	&.has-click {
		cursor: pointer;

		&.disabled {
			cursor: auto;
		}

		input {
			pointer-events: none;

			.prefix,
			.suffix {
				color: var(--foreground-subdued);
			}
		}

		.append-outer {
			margin-left: 8px;
		}
	}
}

.v-icon.active {
	--v-icon-color: var(--primary);
}
</style>
