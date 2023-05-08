<template>
	<div ref="wrapper" class="v-date-picker">
		<input class="input" type="text" data-input />
	</div>
</template>

<script setup lang="ts">
import { getFlatpickrLocale } from '@/utils/get-flatpickr-locale';
import { format, formatISO } from 'date-fns';
import Flatpickr from 'flatpickr';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

interface Props {
	type: 'date' | 'time' | 'dateTime' | 'timestamp';
	modelValue?: string;
	disabled?: boolean;
	includeSeconds?: boolean;
	use24?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	modelValue: undefined,
	disabled: false,
	includeSeconds: false,
	use24: true,
});

const emit = defineEmits(['update:modelValue', 'close']);

const { t } = useI18n();

const wrapper = ref<HTMLElement | null>(null);
let flatpickr: Flatpickr.Instance | null;

onMounted(async () => {
	if (wrapper.value) {
		const flatpickrLocale = await getFlatpickrLocale();
		flatpickr = Flatpickr(wrapper.value as Node, { ...flatpickrOptions.value, locale: flatpickrLocale } as any);
	}

	watch(
		() => props.modelValue,
		() => {
			if (props.modelValue) {
				flatpickr?.setDate(props.modelValue, false);
			} else {
				flatpickr?.clear();
			}
		},
		{ immediate: true }
	);
});

onBeforeUnmount(() => {
	if (flatpickr) {
		flatpickr.close();
		flatpickr = null;
	}
});

const defaultOptions = {
	static: true,
	inline: true,
	nextArrow:
		'<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6-6-6z"/></svg>',
	prevArrow:
		'<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12l4.58-4.59z"/></svg>',
	wrap: true,

	onChange(selectedDates: Date[], _dateStr: string, _instance: Flatpickr.Instance) {
		const selectedDate = selectedDates.length > 0 ? selectedDates[0] : null;
		emitValue(selectedDate);
	},
	onClose(selectedDates: Date[], _dateStr: string, _instance: Flatpickr.Instance) {
		const selectedDate = selectedDates.length > 0 ? selectedDates[0] : null;
		emitValue(selectedDate);
	},
	onReady(_selectedDates: Date[], _dateStr: string, instance: Flatpickr.Instance) {
		const setToNowButton: HTMLElement = document.createElement('button');
		setToNowButton.innerHTML = t('interfaces.datetime.set_to_now');
		setToNowButton.classList.add('set-to-now-button');
		setToNowButton.tabIndex = -1;
		setToNowButton.addEventListener('click', setToNow);
		instance.calendarContainer.appendChild(setToNowButton);

		if (!props.use24) {
			instance.amPM?.addEventListener('keyup', enterToClose);
		} else if (props.includeSeconds) {
			instance.secondElement?.addEventListener('keyup', enterToClose);
		} else {
			instance.minuteElement?.addEventListener('keyup', enterToClose);
		}
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

function emitValue(value: Date | null) {
	if (!value) return emit('update:modelValue', null);

	switch (props.type) {
		case 'dateTime':
			emit('update:modelValue', format(value, "yyyy-MM-dd'T'HH:mm:ss"));
			break;
		case 'date':
			emit('update:modelValue', format(value, 'yyyy-MM-dd'));
			break;
		case 'time':
			emit('update:modelValue', format(value, 'HH:mm:ss'));
			break;
		case 'timestamp':
			emit('update:modelValue', formatISO(value));
			break;
	}

	// close the calendar on input change if it's only a date picker without time input
	if (props.type === 'date') {
		emit('close');
	}
}

function setToNow() {
	flatpickr?.setDate(new Date(), true);
}

function enterToClose(e: any) {
	if (e.key !== 'Enter') return;
	flatpickr?.close();
	emit('close');
}
</script>

<style lang="scss" scoped>
.v-date-picker {
	.input {
		display: none;
	}
}
</style>
