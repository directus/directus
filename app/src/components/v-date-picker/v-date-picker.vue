<script setup lang="ts">
import { CalendarDate, DateFormatter, DateValue } from '@internationalized/date';
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
import { computed } from 'vue';
import { useDatePickerValue } from './use-date-picker-value';
import VIcon from '@/components/v-icon/v-icon.vue';
import VInput from '@/components/v-input.vue';
import VSelect from '@/components/v-select/v-select.vue';
import { useUserStore } from '@/stores/user';

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

const userStore = useUserStore();

const isRTL = computed(() => userStore.textDirection === 'rtl');

const {
	calendarValue,
	timeValue,
	hasTime,
	hourCycle,
	granularity,
	showCalendar,
	applyDate,
	applyTime,
	emitValue,
	setToNow: applyNow,
} = useDatePickerValue({
	type: () => props.type,
	modelValue: () => props.modelValue,
	includeSeconds: () => props.includeSeconds,
	use24: () => props.use24,
	onUpdate: (value) => emit('update:modelValue', value),
});

const monthFormatter = computed(() => {
	// Use 'long' for “January”, 'short' for “Jan”, 'narrow' for “J”
	// timeZone: 'UTC' ensures the month name matches the UTC date created by `toDate('UTC')` below,
	// preventing off-by-one month labels in negative-UTC-offset timezones.
	return new DateFormatter(userStore.language, { month: 'long', timeZone: 'UTC' });
});

const monthOptions = computed(() => {
	return Array.from({ length: 12 }, (_, index) => {
		const value = index + 1;
		const date = new CalendarDate(new Date().getFullYear(), value, 1);

		return {
			value,
			text: monthFormatter.value.format(date.toDate('UTC')),
		};
	});
});

function handleDateChange(value: DateValue | undefined) {
	applyDate(value);

	if (props.type === 'date') {
		emit('close');
	}
}

function setCalendarMonth(month: number): void {
	const now = new Date();
	const base = calendarValue.value ?? new CalendarDate(now.getFullYear(), now.getMonth() + 1, 1);
	const year = base.year;
	const day = Math.min(base.day, new Date(year, month, 0).getDate());

	// Note: This changes the selected date (not just the view month).
	// If later we decide to decouple “view month” from “selected date”, we can introduce separate state.
	calendarValue.value = new CalendarDate(year, month, day);
	emitValue();
}

function setCalendarYear(year: number): void {
	const now = new Date();
	const base = calendarValue.value ?? new CalendarDate(now.getFullYear(), now.getMonth() + 1, 1);
	const month = base.month;
	const day = Math.min(base.day, new Date(year, month, 0).getDate());

	// Note: This changes the selected date (not just the view year).
	calendarValue.value = new CalendarDate(year, month, day);
	emitValue();
}

function handleMonthChange(value: number | null): void {
	if (value === null || value < 1 || value > 12) return;
	setCalendarMonth(value);
}

/**
 * Largest year the picker accepts.
 *
 * Bounded to a 4-digit ISO 8601 year.
 * Without this cap, typing many digits yields a year
 * beyond JS Date's representable range, making `new Date(year, month, 0).getDate()` return NaN
 * in `setCalendarYear` and emitting an invalid string like "9999-06-NaN".
 */
const MAX_YEAR = 9999;

function handleYearChange(value: number | string | undefined): void {
	const numValue = typeof value === 'string' ? Number.parseInt(value, 10) : value;
	// The input emits on every keystroke; only apply complete four-digit years. Below 1000 a partial
	// value like 2 would format to nonsense (near 1900); above MAX_YEAR it exceeds a valid four-digit year.
	if (numValue === undefined || !Number.isFinite(numValue) || numValue < 1000 || numValue > MAX_YEAR) return;
	setCalendarYear(numValue);
}

/**
 * Sets the picker to the current date and time, then closes the popup.
 */
function setToNow() {
	applyNow();
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
							type="text"
							inputmode="numeric"
							:model-value="date?.year"
							:max-length="4"
							class="calendar-year-input"
							:full-width="false"
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
						@update:model-value="applyTime"
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
		inline-size: 1.1875rem;
		block-size: 1.1875rem;
	}

	.calendar {
		font-family: var(--v-input-font-family);
		font-size: 0.8125rem;
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
		padding: 0.375rem;
	}

	.calendar-nav-button {
		display: inline-flex;
		justify-content: center;
		align-items: center;
		inline-size: 2rem;
		block-size: 2rem;
		color: var(--theme--foreground-accent);
		background-color: transparent;
		cursor: pointer;
	}

	.calendar-nav-button:hover {
		color: var(--theme--primary);
	}

	.calendar-heading {
		font-weight: 600;
		font-size: 1rem;
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
		margin-block-start: 0.1875rem;
	}

	.calendar-grid-row {
		display: grid;
		margin-block-end: 0.1875rem;
		grid-template-columns: repeat(7, minmax(0, 1fr));
		inline-size: 100%;
	}

	.calendar-head-cell {
		border-radius: 0.3125rem;
		font-size: 0.6875rem;
		line-height: 1.1818;
		color: var(--theme--foreground-accent);
		font-weight: 600;
	}

	.calendar-cell {
		position: relative;
		font-size: 0.6875rem;
		line-height: 1.4545;
		text-align: center;
	}

	.calendar-cell-trigger {
		display: flex;
		position: relative;
		justify-content: center;
		align-items: center;
		border-width: var(--theme--border-width);
		border-style: solid;
		border-color: transparent;
		font-size: 0.8125rem;
		line-height: 2.5385;
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
		--focus-ring-offset: 2px; /* stylelint-disable-line unit-disallowed-list */ // Avoid reset by _base.scss L52-60
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
		gap: 0.375rem;
		align-items: center;
		justify-content: center;
		padding: 0.375rem 0;
		inline-size: auto;
		font-size: 0.875rem;
		font-weight: 600;
	}

	.calendar-year-input {
		--v-input-font-family: inherit;
		block-size: 1.5625rem;
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
		border-radius: 0.1875rem;
		gap: 0.1875rem;
		text-align: center;
		user-select: none;
	}

	.time-field-segment {
		padding: 0.8125rem 1.1875rem;
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
		padding: 0.375rem;
	}

	.calendar-today-button {
		background: transparent;
		border: none;
		inline-size: 100%;
		cursor: pointer;
		color: var(--theme--primary);
		font-size: 0.8125rem;
		font-weight: 600;
		padding: 0.375rem;
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
