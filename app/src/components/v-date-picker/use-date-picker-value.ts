import { isDynamicVariable, parseNow } from '@directus/utils';
import {
	CalendarDate,
	CalendarDateTime,
	DateValue,
	parseAbsoluteToLocal,
	parseDate,
	parseDateTime,
	parseTime,
	Time,
	ZonedDateTime,
} from '@internationalized/date';
import { computed, type MaybeRefOrGetter, ref, toValue, watch } from 'vue';
import type { TimeValue } from './types';
import { formatDatePickerModelValue } from '@/utils/format-date-picker-model-value';

export type PickerType = 'date' | 'time' | 'dateTime' | 'timestamp';

interface UseDatePickerValueOptions {
	type: MaybeRefOrGetter<PickerType>;
	modelValue: MaybeRefOrGetter<string | null | undefined>;
	includeSeconds: MaybeRefOrGetter<boolean>;
	use24: MaybeRefOrGetter<boolean>;
	/** Called with the formatted model value string whenever the selection changes. */
	onUpdate: (value: string | null) => void;
}

// Shared value logic for the popup picker and the inline trigger field.
export function useDatePickerValue(options: UseDatePickerValueOptions) {
	const type = computed(() => toValue(options.type));
	const includeSeconds = computed(() => toValue(options.includeSeconds));
	const hasTime = computed(() => ['time', 'dateTime', 'timestamp'].includes(type.value));

	const hourCycle = computed(() => (toValue(options.use24) ? 24 : undefined));
	const granularity = computed(() => (includeSeconds.value ? 'second' : 'minute'));
	const showCalendar = computed(() => type.value !== 'time');

	const calendarValue = ref<DateValue | undefined>();

	// Noon, not midnight: a neutral default applied at emit time once a date exists but no time was entered.
	function getDefaultTimeValue(): Time {
		return new Time(12, 0, 0);
	}

	// Left empty until a value is parsed or the user types, so the time segments render as placeholders.
	const internalTimeValue = ref<Time | CalendarDateTime | ZonedDateTime | null | undefined>();

	// Cast around the nominal typing of @internationalized/date classes (private fields) for TimeFieldRoot.
	const timeValue = computed<TimeValue | null | undefined>({
		get() {
			return internalTimeValue.value as TimeValue | null | undefined;
		},
		set(value: TimeValue | null | undefined) {
			internalTimeValue.value = value;
		},
	});

	watch(
		() => toValue(options.modelValue),
		(newValue) => {
			if (!newValue) {
				calendarValue.value = undefined;
				internalTimeValue.value = undefined;

				return;
			}

			// Only $NOW can map to a selection; other dynamic paths (e.g. $CURRENT_USER.date_created) stay empty.
			if (isDynamicVariable(newValue)) {
				if (newValue.startsWith('$NOW')) {
					const dt = parseNow(newValue);

					if (type.value !== 'time') {
						calendarValue.value = new CalendarDate(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
					}

					if (hasTime.value) {
						internalTimeValue.value = new Time(dt.getHours(), dt.getMinutes(), dt.getSeconds());
					}
				}

				return;
			}

			// Fall back to empty on a parse failure rather than crashing the component during setup.
			try {
				switch (type.value) {
					case 'date':
						calendarValue.value = parseDate(newValue);
						break;
					case 'time':
						internalTimeValue.value = parseTime(newValue);
						break;

					case 'dateTime': {
						const dt = parseDateTime(newValue);
						calendarValue.value = new CalendarDate(dt.year, dt.month, dt.day);
						internalTimeValue.value = new Time(dt.hour, dt.minute, dt.second);
						break;
					}

					case 'timestamp': {
						const dt = parseAbsoluteToLocal(newValue);
						calendarValue.value = new CalendarDate(dt.year, dt.month, dt.day);
						internalTimeValue.value = new Time(dt.hour, dt.minute, dt.second);
						break;
					}
				}
			} catch {
				calendarValue.value = undefined;
				internalTimeValue.value = undefined;
			}
		},
		{ immediate: true },
	);

	function emitValue(): void {
		// A date with no time entered yet defaults to noon; the emitted value round-trips back to a real time.
		if (hasTime.value && calendarValue.value && !internalTimeValue.value) {
			internalTimeValue.value = getDefaultTimeValue();
		}

		const value = formatDatePickerModelValue(type.value, {
			calendarValue: calendarValue.value,
			timeValue: internalTimeValue.value,
			includeSeconds: includeSeconds.value,
		});

		options.onUpdate(value);
	}

	function applyDate(value: DateValue | undefined) {
		calendarValue.value = value;
		emitValue();
	}

	function applyTime(value: TimeValue | null | undefined) {
		internalTimeValue.value = value ?? null;
		emitValue();
	}

	function setToNow() {
		const now = new Date();
		calendarValue.value = new CalendarDate(now.getFullYear(), now.getMonth() + 1, now.getDate());

		if (hasTime.value) {
			internalTimeValue.value = new Time(now.getHours(), now.getMinutes(), now.getSeconds());
		}

		emitValue();
	}

	return {
		calendarValue,
		internalTimeValue,
		timeValue,
		hasTime,
		hourCycle,
		granularity,
		showCalendar,
		emitValue,
		applyDate,
		applyTime,
		setToNow,
	};
}
