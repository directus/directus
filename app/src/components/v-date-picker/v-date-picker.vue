<script setup lang="ts">
import {
	CalendarDate,
	CalendarDateTime,
	DateFormatter,
	DateValue,
	parseAbsoluteToLocal,
	parseDate,
	parseDateTime,
	parseTime,
	Time,
	ZonedDateTime,
} from '@internationalized/date';
import {
	CalendarCell,
	CalendarCellTrigger,
	CalendarGrid,
	CalendarGridBody,
	CalendarGridHead,
	CalendarGridRow,
	CalendarHeadCell,
	CalendarHeader,
	CalendarHeading,
	CalendarNext,
	CalendarPrev,
	CalendarRoot,
	TimeFieldInput,
	TimeFieldRoot,
} from 'reka-ui';
import { computed, ref, watch } from 'vue';
import { TimeValue } from './types';
import VIcon from '@/components/v-icon/v-icon.vue';
import VInput from '@/components/v-input.vue';
import VSelect from '@/components/v-select/v-select.vue';
import { useUserStore } from '@/stores/user';
import { formatDatePickerModelValue } from '@/utils/format-date-picker-model-value';

interface Props {
	type: 'date' | 'time' | 'dateTime' | 'timestamp';
	modelValue?: string | null;
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

const emit = defineEmits<{
	'update:modelValue': [value: string | null];
	close: [];
}>();

// Internal state using @internationalized/date types
const calendarValue = ref<DateValue | undefined>();

const userStore = useUserStore();

const isRTL = computed(() => userStore.textDirection === 'rtl');

// Computed props for Reka UI
// We set undefined instead of 12 to avoid the default value of 12:00 PM goes 0:00 PM
const hourCycle = computed(() => (props.use24 ? 24 : undefined));
const granularity = computed(() => (props.includeSeconds ? 'second' : 'minute'));
const showCalendar = computed(() => props.type !== 'time');
const hasTime = computed(() => ['time', 'dateTime', 'timestamp'].includes(props.type));

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
	['time', 'dateTime', 'timestamp'].includes(props.type) ? getDefaultTimeValue() : undefined,
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

const monthFormatter = computed(() => {
	// Use 'long' for “January”, 'short' for “Jan”, 'narrow' for “J”
	return new DateFormatter(userStore.language, { month: 'long' });
});

const monthOptions = computed(() => {
	return Array.from({ length: 12 }, (_, index) => {
		const value = index + 1;
		const date = new CalendarDate(new Date().getFullYear(), value, 1);

		return {
			value,
			// This `DateFormatter` type expects a native `Date`, so we convert using UTC.
			// (Timezone doesn't matter for month names; this keeps it stable.)
			text: monthFormatter.value.format(date.toDate('UTC')),
		};
	});
});

watch(
	() => props.modelValue,
	(newValue) => {
		if (!newValue) {
			calendarValue.value = undefined;

			// Reset time to a sensible default when the picker supports time.
			internalTimeValue.value = hasTime.value ? getDefaultTimeValue() : undefined;

			return;
		}

		// Parse based on type
		switch (props.type) {
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

// Data binding to the model value and emitting the value to the parent component

function emitValue(): void {
	const value = formatDatePickerModelValue(props.type, {
		calendarValue: calendarValue.value,
		timeValue: internalTimeValue.value,
		includeSeconds: props.includeSeconds,
	});

	emit('update:modelValue', value);
}

function handleDateChange(value: DateValue | undefined) {
	calendarValue.value = value;
	emitValue();

	if (props.type === 'date') {
		emit('close');
	}
}

/**
 * Handle time field changes and emit the updated value.
 * Reka UI's TimeFieldRoot emits TimeValue which is Time | CalendarDateTime | ZonedDateTime.
 *
 * @param value - The new time value from the TimeFieldRoot component
 */
function handleTimeChange(value: TimeValue | undefined) {
	internalTimeValue.value = value ?? null;
	emitValue();
}

function setCalendarMonth(month: number): void {
	const now = new Date();
	const base = calendarValue.value ?? new CalendarDate(now.getFullYear(), now.getMonth() + 1, 1);
	const year = base.year;
	const day = Math.min(base.day, new Date(year, month, 0).getDate());

	// Note: This changes the selected date (not just the view month).
	// If later we decide to decouple “view month” from “selected date”, we can introduce separate state.
	calendarValue.value = new CalendarDate(year, month, day);
}

function setCalendarYear(year: number): void {
	const now = new Date();
	const base = calendarValue.value ?? new CalendarDate(now.getFullYear(), now.getMonth() + 1, 1);
	const month = base.month;
	const day = Math.min(base.day, new Date(year, month, 0).getDate());

	// Note: This changes the selected date (not just the view year).
	calendarValue.value = new CalendarDate(year, month, day);
}

function handleMonthChange(value: number | null): void {
	if (value === null || value < 1 || value > 12) return;
	setCalendarMonth(value);
}

function handleYearChange(value: number | string | undefined): void {
	const numValue = typeof value === 'string' ? Number.parseInt(value, 10) : value;
	if (numValue === undefined || !Number.isFinite(numValue) || numValue < 1) return;
	setCalendarYear(numValue);
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
	emit('close');
}
</script>

<template>
	<div class="v-date-picker">
		<CalendarRoot
			v-slot="{ weekDays, grid, date }"
			:model-value="calendarValue"
			:disabled="disabled"
			class="calendar"
			fixed-weeks
			weekday-format="short"
			:dir="isRTL ? 'rtl' : 'ltr'"
			@update:model-value="handleDateChange"
		>
			<CalendarHeader v-if="showCalendar" class="calendar-header">
				<CalendarPrev class="calendar-nav-button">
					<VIcon name="chevron_left" />
				</CalendarPrev>
				<CalendarHeading class="calendar-heading">
					<div class="calendar-header-inputgroup">
						<VSelect
							:model-value="date?.month"
							:items="monthOptions"
							class="calendar-month-select"
							inline
							:full-width="false"
							@update:model-value="handleMonthChange"
						/>
						<VInput
							type="number"
							:model-value="date?.year"
							class="calendar-year-input"
							:full-width="false"
							hide-arrows
							@update:model-value="handleYearChange"
						/>
					</div>
				</CalendarHeading>
				<CalendarNext class="calendar-nav-button">
					<VIcon name="chevron_right" />
				</CalendarNext>
			</CalendarHeader>
			<div class="calendar-wrapper">
				<template v-if="showCalendar">
					<CalendarGrid v-for="month in grid" :key="month.value.toString()" class="calendar-grid">
						<CalendarGridHead class="calendar-grid-head">
							<CalendarGridRow class="calendar-grid-row">
								<CalendarHeadCell v-for="day in weekDays" :key="day" class="calendar-head-cell">
									{{ day }}
								</CalendarHeadCell>
							</CalendarGridRow>
						</CalendarGridHead>
						<CalendarGridBody class="calendar-grid-body">
							<CalendarGridRow
								v-for="(weekDates, index) in month.rows"
								:key="`weekDate-${index}`"
								class="calendar-grid-row"
							>
								<CalendarCell
									v-for="weekDate in weekDates"
									:key="weekDate.toString()"
									:date="weekDate"
									class="calendar-cell"
								>
									<CalendarCellTrigger :day="weekDate" :month="month.value" class="calendar-cell-trigger" />
								</CalendarCell>
							</CalendarGridRow>
						</CalendarGridBody>
					</CalendarGrid>
				</template>
				<div v-if="hasTime" class="time-picker">
					<TimeFieldRoot
						id="time-field"
						v-slot="{ segments }"
						:model-value="timeValue"
						:granularity
						:hour-cycle
						:dir="isRTL ? 'rtl' : 'ltr'"
						class="time-field"
						@update:model-value="handleTimeChange"
					>
						<template v-for="item in segments" :key="item.part">
							<TimeFieldInput v-if="item.part === 'literal'" :part="item.part" class="time-field-literal">
								{{ item.value }}
							</TimeFieldInput>
							<TimeFieldInput v-else :part="item.part" class="time-field-segment">
								{{ item.value }}
							</TimeFieldInput>
						</template>
					</TimeFieldRoot>
				</div>
				<!-- Today Button -->
				<div class="calendar-footer">
					<button class="calendar-today-button" @click="setToNow">{{ $t('set_to_now') }}</button>
				</div>
			</div>
		</CalendarRoot>
	</div>
</template>

<style lang="scss" scoped>
.v-date-picker {
	.icon {
		inline-size: 1.5rem;
		block-size: 1.5rem;
	}

	.calendar {
		font-family: var(--v-input-font-family);
		font-size: 1rem;
		background: var(--theme--form--field--input--background);
		border-radius: var(--theme--border-radius);
		box-shadow: none;
	}

	.calendar-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		color: var(--theme--foreground-accent);
		background: var(--theme--background-normal);
		padding: 0.5rem;
	}

	.calendar-nav-button {
		display: inline-flex;
		justify-content: center;
		align-items: center;
		inline-size: 2.5rem;
		block-size: 2.5rem;
		color: var(--theme--foreground-accent);
		background-color: transparent;
		cursor: pointer;
	}

	.calendar-nav-button:hover {
		color: var(--theme--primary);
	}

	.calendar-heading {
		font-weight: 600;
		font-size: 1.25rem;
		color: var(--theme--primary);
	}

	.calendar-wrapper {
		display: flex;
		flex-direction: column;
	}

	.calendar-grid {
		inline-size: 100%;
		user-select: none;
		border-collapse: collapse;
	}

	.calendar-grid-head {
		background: var(--theme--background-normal);
	}

	.calendar-grid-body {
		margin-block-start: 0.25rem;
	}

	.calendar-grid-row {
		display: grid;
		margin-block-end: 0.25rem;
		grid-template-columns: repeat(7, minmax(0, 1fr));
		inline-size: 100%;
	}

	.calendar-head-cell {
		border-radius: 0.375rem;
		font-size: 0.85rem;
		line-height: 1rem;
		color: var(--theme--foreground-accent);
		font-weight: 600;
	}

	.calendar-cell {
		position: relative;
		font-size: 0.875rem;
		line-height: 1.25rem;
		text-align: center;
	}

	.calendar-cell-trigger {
		display: flex;
		position: relative;
		justify-content: center;
		align-items: center;
		border-width: 2px;
		border-style: solid;
		border-color: transparent;
		font-size: 1rem;
		line-height: 2.65rem;
		font-weight: 500;
		border-radius: var(--theme--border-radius);
		color: var(--theme--foreground);
		white-space: nowrap;
		background-color: transparent;
	}

	.calendar-cell-trigger:hover {
		color: var(--theme--foreground);
		background-color: var(--background-highlight);
		border-color: var(--background-highlight);
	}

	.calendar-cell-trigger[data-disabled] {
		cursor: not-allowed;
		color: var(--theme--foreground-subdued);
	}

	.calendar-cell-trigger[data-today] {
		background-color: transparent;
		border-color: var(--theme--primary);
	}

	.calendar-cell-trigger[data-selected] {
		background-color: var(--theme--primary);
		color: var(--theme--primary-background);
		border-color: var(--theme--primary);
	}

	.calendar-cell-trigger[data-selected]:focus {
		--focus-ring-offset: 2px; // Avoid reset by _base.scss L52-60
		outline: var(--focus-ring-width) solid var(--focus-ring-color);
		outline-offset: var(--focus-ring-offset);
	}

	.calendar-cell-trigger[data-unavailable] {
		color: var(--theme--foreground-subdued);
		text-decoration: line-through;
	}

	.calendar-cell-trigger[data-outside-view] {
		color: var(--theme--foreground-subdued);
	}

	.calendar-header-inputgroup {
		display: inline-flex;
		gap: 0.5rem;
		align-items: center;
		justify-content: center;
		padding: 0.5rem 0;
		inline-size: auto;
		font-size: 16px;
		font-weight: 600;
	}

	.calendar-year-input {
		--v-input-font-family: inherit;
		block-size: 28px;
		background-color: transparent;

		:deep(.input) {
			inline-size: 7.5ch;
			outline: none;
			color: var(--theme--primary);
			border-color: transparent;
			background-color: transparent;
		}
	}

	.time-picker {
		display: flex;
		justify-content: center;
		inline-size: 100%;
		border-block-start: 1px solid var(--theme--border-color);
		border-block-end: 1px solid var(--theme--border-color);
	}

	.time-field {
		display: flex;
		align-items: center;
		border-radius: 0.25rem;
		gap: 0.25rem;
		border-width: 1px;
		text-align: center;
		user-select: none;
	}

	.time-field-segment {
		padding: 1rem 1.5rem;
		background: var(--theme--form--field--input--background-subdued);
	}

	.time-field-segment:focus,
	.time-field-segment:focus-visible {
		outline: var(--focus-ring-width) solid var(--focus-ring-color);
		outline-offset: var(--focus-ring-offset);
		border-radius: var(--focus-ring-radius);
	}

	.calendar-footer {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 0.5rem;
	}

	.calendar-today-button {
		background: transparent;
		border: none;
		inline-size: 100%;
		cursor: pointer;
		color: var(--theme--primary);
		font-size: 1rem;
		font-weight: 600;
		padding: 0.5rem;
	}

	.calendar-today-button:focus,
	.calendar-today-button:focus-visible {
		outline: var(--focus-ring-width) solid var(--focus-ring-color);
		outline-offset: var(--focus-ring-offset);
		border-radius: var(--focus-ring-radius);
	}

	.calendar-today-button:hover {
		color: var(--theme--primary);
		background-color: var(--background-highlight);
		border-color: var(--background-highlight);
	}
}
</style>
