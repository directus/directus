<template>
	<div ref="wrapper" class="v-date-picker">
		<input class="input" type="text" :placeholder="t('enter_a_value')" data-input />
		<button type="button">
			<v-icon :name="modelValue ? 'close' : 'today'" :class="{ active: isDatePickerOpen }" @click.stop="unsetValue" />
		</button>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, ref, onMounted, onBeforeUnmount, computed, PropType } from 'vue';
import Flatpickr from 'flatpickr';
import { format, formatISO } from 'date-fns';
import getFlatpickrLocale from '@/utils/get-flatpickr-locale';

export default defineComponent({
	props: {
		modelValue: {
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

		const wrapper = ref<HTMLElement | null>(null);
		let flatpickr: Flatpickr.Instance | null;

		const isDatePickerOpen = ref<boolean>(false);

		onMounted(async () => {
			if (wrapper.value) {
				const locale = await getFlatpickrLocale();
				flatpickr = Flatpickr(wrapper.value, { ...flatpickrOptions.value, locale });
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
			// autoFillDefaultTime: false,
			nextArrow:
				'<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6-6-6z"/></svg>',
			prevArrow:
				'<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12l4.58-4.59z"/></svg>',
			position: (self: Flatpickr.Instance) => {
				const wrapperBounds = wrapper.value!.getBoundingClientRect();
				const calendarHeight = Array.prototype.reduce.call(
					self.calendarContainer.children,
					((acc: number, child: HTMLElement) => acc + child.offsetHeight) as any,
					0
				) as number;
				const distanceFromBottom = window.innerHeight - wrapperBounds.bottom;
				const showOnTop = distanceFromBottom < calendarHeight && wrapperBounds.top > calendarHeight;

				const top =
					window.pageYOffset + wrapperBounds.top + (!showOnTop ? wrapper.value!.offsetHeight + 2 : -calendarHeight - 2);
				const left = window.pageXOffset + wrapperBounds.left;
				const right = window.document.body.offsetWidth - (window.pageXOffset + wrapperBounds.right);

				self.calendarContainer.style.top = `${top}px`;
				self.calendarContainer.style.left = `${left}px`;
				self.calendarContainer.style.right = `${right}px`;
			},
			wrap: true,

			onChange(selectedDates: Date[], _dateStr: string, _instance: Flatpickr.Instance) {
				const selectedDate = selectedDates.length > 0 ? selectedDates[0] : null;

				if (!selectedDate) return emit('update:modelValue', null);

				switch (props.type) {
					case 'dateTime':
						return emit('update:modelValue', format(selectedDate, "yyyy-MM-dd'T'HH:mm:ss"));
					case 'date':
						return emit('update:modelValue', format(selectedDate, 'yyyy-MM-dd'));
					case 'time':
						return emit('update:modelValue', format(selectedDate, 'HH:mm:ss'));
					case 'timestamp':
						return emit('update:modelValue', formatISO(selectedDate));
				}
			},
			onClose() {
				isDatePickerOpen.value = false;
			},
			onOpen() {
				isDatePickerOpen.value = true;
			},
			onReady(_selectedDates: Date[], _dateStr: string, instance: Flatpickr.Instance) {
				const setToNowButton: HTMLElement = document.createElement('button');
				setToNowButton.innerHTML = t('interfaces.datetime.set_to_now');
				setToNowButton.classList.add('set-to-now-button');
				setToNowButton.tabIndex = -1;
				setToNowButton.addEventListener('click', setToNow);
				instance.calendarContainer.appendChild(setToNowButton);
			},
		};

		const flatpickrOptions = computed<Record<string, any>>(() => {
			return Object.assign({}, defaultOptions, {
				altFormat: getAltFormat(),
				enableSeconds: props.includeSeconds,
				enableTime: ['dateTime', 'time', 'timestamp'].includes(props.type),
				noCalendar: props.type === 'time',
				time_24hr: props.use24,
			});
		});

		function getAltFormat() {
			switch (props.type) {
				case 'dateTime':
					if (props.use24) {
						return props.includeSeconds ? 'F j, Y H:i:S' : 'F j, Y H:i';
					} else {
						return props.includeSeconds ? 'F j, Y h:i:S K' : 'F j, Y h:i K';
					}
				case 'date':
					return 'F j, Y';
				case 'time':
					if (props.use24) {
						return props.includeSeconds ? 'H:i:S' : 'H:i';
					} else {
						return props.includeSeconds ? 'h:i:S K' : 'h:i K';
					}
				case 'timestamp':
					return 'Z';
			}
		}

		function setToNow() {
			flatpickr?.setDate(new Date(), true);
			flatpickr?.close();
		}

		function unsetValue() {
			flatpickr?.close();
			flatpickr?.clear();
			emit('update:modelValue', null);
		}

		return { t, wrapper, isDatePickerOpen, unsetValue };
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
