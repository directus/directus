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
	/** Called with the formatted model value string whenever the selection changes. */
	onUpdate: (value: string | null) => void;
}

/**
 * Shared value logic for the date picker and its inline trigger field.
 *
 * Keeps the `modelValue` string as the single source of truth and converts it to/from the
 * `@internationalized/date` types used by Reka UI. By sharing this composable, the popup
 * calendar and the inline trigger field parse and format the same string identically — so
 * they stay in sync without any extra wiring, and editing only the date preserves an existing
 * time component.
 */
export function useDatePickerValue(options: UseDatePickerValueOptions) {
	const type = computed(() => toValue(options.type));
	const includeSeconds = computed(() => toValue(options.includeSeconds));
	const hasTime = computed(() => ['time', 'dateTime', 'timestamp'].includes(type.value));

	// Internal state using @internationalized/date types
	const calendarValue = ref<DateValue | undefined>();

	/**
	 * Default time (12:00) when the picker supports time.
	 *
	 * Why 12:00:
	 * - It’s a neutral default (avoids implicit "start of day" midnight)
	 * - Prevents emitting `00:00:00` unless the user explicitly selects it
	 */
	function getDefaultTimeValue(): Time {
		return new Time(12, 0, 0);
	}

	/**
	 * Internal time value state.
	 * Initialized with a default time (12:00) when the picker type supports time.
	 */
	const internalTimeValue = ref<Time | CalendarDateTime | ZonedDateTime | null | undefined>(
		hasTime.value ? getDefaultTimeValue() : undefined,
	);

	/**
	 * Computed property that provides proper type compatibility for the TimeFieldRoot component.
	 * This works around nominal typing issues with @internationalized/date classes that have private fields.
	 */
	const timeValue = computed<TimeValue | null | undefined>({
		get() {
			return internalTimeValue.value as TimeValue | null | undefined;
		},
		set(value: TimeValue | null | undefined) {
			internalTimeValue.value = value;
		},
	});

	/** True when the value is a dynamic variable (e.g. `$NOW`, `$CURRENT_USER.date_created`). */
	const isDynamic = computed(() => {
		const value = toValue(options.modelValue);
		return !!value && isDynamicVariable(value);
	});

	/** True when there is no value set. */
	const isEmpty = computed(() => {
		const value = toValue(options.modelValue);
		return value === null || value === undefined || value === '';
	});

	watch(
		() => toValue(options.modelValue),
		(newValue) => {
			if (!newValue) {
				calendarValue.value = undefined;

				// Reset time to a sensible default when the picker supports time.
				internalTimeValue.value = hasTime.value ? getDefaultTimeValue() : undefined;

				return;
			}

			// Resolve $NOW variables to a selection.
			// Other dynamic variable paths (e.g. $CURRENT_USER.date_created) can't be displayed in the picker, so leave it in the default empty state.
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

			// Parse based on type
			switch (type.value) {
				case 'date':
					calendarValue.value = parseDate(newValue);
					break;
				case 'time':
					internalTimeValue.value = parseTime(newValue);
					break;

				case 'dateTime': {
					// Matches legacy Flatpickr format: "yyyy-MM-dd'T'HH:mm:ss"
					const dt = parseDateTime(newValue);
					calendarValue.value = new CalendarDate(dt.year, dt.month, dt.day);
					internalTimeValue.value = new Time(dt.hour, dt.minute, dt.second);
					break;
				}

				case 'timestamp': {
					// Matches legacy Flatpickr format: Date.toISOString() (absolute timestamp)
					const dt = parseAbsoluteToLocal(newValue);
					calendarValue.value = new CalendarDate(dt.year, dt.month, dt.day);
					internalTimeValue.value = new Time(dt.hour, dt.minute, dt.second);
					break;
				}
			}
		},
		{ immediate: true },
	);

	function emitValue(): void {
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

	/** Apply a date from a Reka DateField, enforcing a 4-digit year before committing. */
	function handleDateFieldChange(value: DateValue | undefined) {
		// enforce 4 digit year
		if (value && value.year < 1000) return;

		applyDate(value);
	}

	function applyTime(value: TimeValue | null | undefined) {
		internalTimeValue.value = value ?? null;
		emitValue();
	}

	/**
	 * Sets the picker to the current date and time.
	 * If the picker supports time, also sets the current time value.
	 */
	function setToNow() {
		const now = new Date();
		calendarValue.value = new CalendarDate(now.getFullYear(), now.getMonth() + 1, now.getDate());

		// If the picker supports time, also set the current time
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
		isDynamic,
		isEmpty,
		emitValue,
		applyDate,
		applyTime,
		handleDateFieldChange,
		setToNow,
	};
}
