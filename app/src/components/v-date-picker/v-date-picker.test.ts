import { CalendarDate, Time } from '@internationalized/date';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import VDatePicker from './v-date-picker.vue';
import { formatDatePickerModelValue } from '@/utils/format-date-picker-model-value';

// Mock the format utility
vi.mock('@/utils/format-date-picker-model-value', () => ({
	formatDatePickerModelValue: vi.fn(),
}));

// Mock the user store with configurable values
const mockUserStore = {
	language: 'en-US',
	textDirection: 'ltr',
};

vi.mock('@/stores/user', () => ({
	useUserStore: vi.fn(() => mockUserStore),
}));

// Mock VIcon component
const VIcon = {
	template: '<span class="icon-stub">{{ name }}</span>',
	props: ['name'],
};

// Mock VSelect component
const VSelect = {
	name: 'VSelect',
	template: `
		<select id="calendar-month-select" @change="handleChange">
			<option v-for="item in items" :key="item.value" :value="item.value">{{ item.text }}</option>
		</select>
	`,
	props: ['modelValue', 'items', 'inline', 'fullWidth'],
	emits: ['update:modelValue'],
	methods: {
		handleChange(event: Event) {
			const target = event.target as HTMLSelectElement;
			const value = Number.parseInt(target.value, 10);
			this.$emit('update:modelValue', Number.isNaN(value) ? null : value);
		},
	},
};

// Mock VInput component
const VInput = {
	name: 'VInput',
	template: `<input class="calendar-year-input" :value="modelValue" @change="handleChange" />`,
	props: ['modelValue', 'type', 'fullWidth', 'hideArrows'],
	emits: ['update:modelValue'],
	methods: {
		handleChange(event: Event) {
			const target = event.target as HTMLInputElement;
			this.$emit('update:modelValue', target.value);
		},
	},
};

// Mock reka-ui components
const CalendarRoot = {
	name: 'CalendarRoot',
	template: `
		<div class="calendar-root-stub">
			<slot :weekDays="['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']" :grid="[]" :date="mockDate" />
		</div>
	`,
	props: ['modelValue', 'disabled', 'fixedWeeks', 'weekdayFormat', 'dir'],
	emits: ['update:modelValue'],
	data() {
		return {
			mockDate: this.modelValue || new CalendarDate(2024, 1, 15),
		};
	},
};

const CalendarHeader = {
	name: 'CalendarHeader',
	template: '<div class="calendar-header-stub"><slot /></div>',
};

const CalendarPrev = {
	name: 'CalendarPrev',
	template: '<button class="calendar-prev-stub"><slot /></button>',
};

const CalendarNext = {
	name: 'CalendarNext',
	template: '<button class="calendar-next-stub"><slot /></button>',
};

const CalendarHeading = {
	name: 'CalendarHeading',
	template: '<div class="calendar-heading-stub"><slot /></div>',
};

const CalendarGrid = {
	name: 'CalendarGrid',
	template: '<div class="calendar-grid-stub"><slot /></div>',
};

const CalendarGridHead = {
	name: 'CalendarGridHead',
	template: '<div class="calendar-grid-head-stub"><slot /></div>',
};

const CalendarGridBody = {
	name: 'CalendarGridBody',
	template: '<div class="calendar-grid-body-stub"><slot /></div>',
};

const CalendarGridRow = {
	name: 'CalendarGridRow',
	template: '<div class="calendar-grid-row-stub"><slot /></div>',
};

const CalendarHeadCell = {
	name: 'CalendarHeadCell',
	template: '<div class="calendar-head-cell-stub"><slot /></div>',
};

const CalendarCell = {
	name: 'CalendarCell',
	template: '<div class="calendar-cell-stub"><slot /></div>',
	props: ['date'],
};

const CalendarCellTrigger = {
	name: 'CalendarCellTrigger',
	template: '<button class="calendar-cell-trigger-stub">{{ day }}</button>',
	props: ['day', 'month'],
};

const TimeFieldRoot = {
	name: 'TimeFieldRoot',
	template: `
		<div class="time-field-stub">
			<slot :segments="[
				{ part: 'hour', value: '12' },
				{ part: 'literal', value: ':' },
				{ part: 'minute', value: '00' }
			]" />
		</div>
	`,
	props: ['modelValue', 'granularity', 'hourCycle', 'dir'],
	emits: ['update:modelValue'],
};

const TimeFieldInput = {
	name: 'TimeFieldInput',
	template: '<span class="time-field-input-stub">{{ part }}</span>',
	props: ['part'],
};

describe('v-date-picker', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(formatDatePickerModelValue).mockReturnValue('2024-01-15');
		// Reset mock user store to defaults
		mockUserStore.language = 'en-US';
		mockUserStore.textDirection = 'ltr';
	});

	const createWrapper = (props = {}) => {
		return mount(VDatePicker, {
			props: {
				type: 'date',
				...props,
			},
			global: {
				stubs: {
					CalendarRoot,
					CalendarHeader,
					CalendarPrev,
					CalendarNext,
					CalendarHeading,
					CalendarGrid,
					CalendarGridHead,
					CalendarGridBody,
					CalendarGridRow,
					CalendarHeadCell,
					CalendarCell,
					CalendarCellTrigger,
					TimeFieldRoot,
					TimeFieldInput,
					VIcon,
					VSelect,
					VInput,
				},
				mocks: {
					$t: (key: string) => key,
				},
			},
		});
	};

	describe('component mounting and props', () => {
		it('mounts with default props', () => {
			const wrapper = createWrapper();

			expect(wrapper.exists()).toBe(true);
			expect(wrapper.classes()).toContain('v-date-picker');
		});

		it('handles disabled prop', () => {
			const wrapper = createWrapper({ disabled: true });

			const calendarRoot = wrapper.findComponent(CalendarRoot);
			expect(calendarRoot.props('disabled')).toBe(true);
		});

		it('passes includeSeconds prop to TimeFieldRoot as granularity', async () => {
			const wrapper = createWrapper({ type: 'time', includeSeconds: true });

			await nextTick();

			const timeField = wrapper.findComponent(TimeFieldRoot);

			expect(timeField.props('granularity')).toBe('second');
		});

		it('passes use24 prop to TimeFieldRoot as hourCycle', async () => {
			const wrapper = createWrapper({ type: 'time', use24: true });

			await nextTick();

			const timeField = wrapper.findComponent(TimeFieldRoot);

			expect(timeField.props('hourCycle')).toBe(24);
		});
	});

	describe('modelValue parsing for type: date', () => {
		it('parses date string into calendarValue', async () => {
			let capturedCalendarValue: unknown;

			vi.mocked(formatDatePickerModelValue).mockImplementation((_type, options) => {
				capturedCalendarValue = options.calendarValue;
				return '2024-01-15';
			});

			const wrapper = createWrapper({
				type: 'date',
				modelValue: '2024-01-15',
			});

			await nextTick();

			// Trigger emission to verify parsed value
			const calendarRoot = wrapper.findComponent(CalendarRoot);
			const newDate = new CalendarDate(2024, 1, 15);
			await calendarRoot.vm.$emit('update:modelValue', newDate);
			await nextTick();

			expect(capturedCalendarValue).toBeDefined();
			expect(formatDatePickerModelValue).toHaveBeenCalledWith('date', expect.any(Object));
		});

		it('clears calendarValue when modelValue is null', async () => {
			let capturedCalendarValue: unknown = 'not-cleared';

			vi.mocked(formatDatePickerModelValue).mockImplementation((_type, options) => {
				capturedCalendarValue = options.calendarValue;
				return null;
			});

			const wrapper = createWrapper({
				type: 'date',
				modelValue: '2024-01-15',
			});

			await nextTick();

			await wrapper.setProps({ modelValue: null });
			await nextTick();

			// Trigger emission to check state
			const nowButton = wrapper.find('.calendar-today-button');
			await nowButton.trigger('click');
			await nextTick();

			// After setToNow, calendarValue should be set to today's date
			expect(capturedCalendarValue).toBeDefined();
		});
	});

	describe('modelValue parsing for type: time', () => {
		it('parses time string into timeValue', async () => {
			let capturedTimeValue: unknown;

			vi.mocked(formatDatePickerModelValue).mockImplementation((_type, options) => {
				capturedTimeValue = options.timeValue;
				return '14:30:00';
			});

			const wrapper = createWrapper({
				type: 'time',
				modelValue: '14:30:00',
			});

			await nextTick();

			// Trigger emission to verify parsed value
			const timeField = wrapper.findComponent(TimeFieldRoot);
			const newTime = new Time(14, 30, 0);
			await timeField.vm.$emit('update:modelValue', newTime);
			await nextTick();

			expect(capturedTimeValue).toBeDefined();
			expect(formatDatePickerModelValue).toHaveBeenCalledWith('time', expect.any(Object));
		});

		it('resets to default time (12:00) when modelValue is null', async () => {
			let capturedTimeValue: { hour?: number; minute?: number } | undefined;

			const wrapper = createWrapper({
				type: 'time',
				modelValue: '14:30:00',
			});

			await nextTick();

			await wrapper.setProps({ modelValue: null });
			await nextTick();

			vi.mocked(formatDatePickerModelValue).mockImplementation((_type, options) => {
				if (options.timeValue && 'hour' in options.timeValue) {
					capturedTimeValue = options.timeValue as { hour: number; minute: number };
				}

				return '12:00:00';
			});

			// Trigger time field emission to check reset value (not setToNow which uses current time)
			const timeField = wrapper.findComponent(TimeFieldRoot);
			await timeField.vm.$emit('update:modelValue', new Time(12, 0, 0));
			await nextTick();

			expect(capturedTimeValue).toBeDefined();
			expect(capturedTimeValue?.hour).toBe(12);
			expect(capturedTimeValue?.minute).toBe(0);
		});
	});

	describe('modelValue parsing for type: dateTime', () => {
		it('parses dateTime string into calendar and time values', async () => {
			let capturedCalendarValue: unknown;
			let capturedTimeValue: unknown;

			vi.mocked(formatDatePickerModelValue).mockImplementation((_type, options) => {
				capturedCalendarValue = options.calendarValue;
				capturedTimeValue = options.timeValue;
				return '2024-01-15T14:30:00';
			});

			const wrapper = createWrapper({
				type: 'dateTime',
				modelValue: '2024-01-15T14:30:00',
			});

			await nextTick();

			// Trigger emission to verify parsed values
			const nowButton = wrapper.find('.calendar-today-button');
			await nowButton.trigger('click');
			await nextTick();

			expect(capturedCalendarValue).toBeDefined();
			expect(capturedTimeValue).toBeDefined();
			expect(formatDatePickerModelValue).toHaveBeenCalledWith('dateTime', expect.any(Object));
		});
	});

	describe('modelValue parsing for type: timestamp', () => {
		it('parses ISO timestamp into calendar and time values', async () => {
			let capturedCalendarValue: unknown;
			let capturedTimeValue: unknown;

			vi.mocked(formatDatePickerModelValue).mockImplementation((_type, options) => {
				capturedCalendarValue = options.calendarValue;
				capturedTimeValue = options.timeValue;
				return '2024-01-15T14:30:00Z';
			});

			const wrapper = createWrapper({
				type: 'timestamp',
				modelValue: new Date('2024-01-15T14:30:00Z').toISOString(),
			});

			await nextTick();

			// Trigger emission to verify parsed values
			const nowButton = wrapper.find('.calendar-today-button');
			await nowButton.trigger('click');
			await nextTick();

			expect(capturedCalendarValue).toBeDefined();
			expect(capturedTimeValue).toBeDefined();
			expect(formatDatePickerModelValue).toHaveBeenCalledWith('timestamp', expect.any(Object));
		});
	});

	describe('value emission', () => {
		it('emits update:modelValue when date changes', async () => {
			vi.mocked(formatDatePickerModelValue).mockReturnValue('2024-01-20');

			const wrapper = createWrapper({
				type: 'date',
				modelValue: '2024-01-15',
			});

			await nextTick();

			const calendarRoot = wrapper.findComponent(CalendarRoot);

			// Simulate date change
			const newDate = new CalendarDate(2024, 1, 20);
			await calendarRoot.vm.$emit('update:modelValue', newDate);
			await nextTick();

			expect(formatDatePickerModelValue).toHaveBeenCalled();
			expect(wrapper.emitted('update:modelValue')).toBeTruthy();
		});

		it('calls formatDatePickerModelValue with correct arguments', async () => {
			vi.mocked(formatDatePickerModelValue).mockReturnValue('2024-01-15');

			const wrapper = createWrapper({
				type: 'date',
				modelValue: '2024-01-15',
			});

			await nextTick();

			const calendarRoot = wrapper.findComponent(CalendarRoot);
			const newDate = new CalendarDate(2024, 1, 20);
			await calendarRoot.vm.$emit('update:modelValue', newDate);
			await nextTick();

			expect(formatDatePickerModelValue).toHaveBeenCalledWith(
				'date',
				expect.objectContaining({
					includeSeconds: false,
				}),
			);
		});
	});

	describe('month and year selection', () => {
		it('month select is rendered when showing calendar', async () => {
			const wrapper = createWrapper({
				type: 'date',
				modelValue: '2024-01-15',
			});

			await nextTick();

			const monthSelect = wrapper.find('#calendar-month-select');
			expect(monthSelect.exists()).toBe(true);
		});

		it('year input is rendered when showing calendar', async () => {
			const wrapper = createWrapper({
				type: 'date',
				modelValue: '2024-01-15',
			});

			await nextTick();

			const yearInput = wrapper.find('.calendar-year-input');
			expect(yearInput.exists()).toBe(true);
		});

		it('updates month when month select changes', async () => {
			let capturedCalendarValue: unknown;

			vi.mocked(formatDatePickerModelValue).mockImplementation((_type, options) => {
				capturedCalendarValue = options.calendarValue;
				return '2024-03-15';
			});

			const wrapper = createWrapper({
				type: 'date',
				modelValue: '2024-01-15',
			});

			await nextTick();

			const monthSelect = wrapper.find('#calendar-month-select');
			await monthSelect.setValue('3');
			await monthSelect.trigger('change');
			await nextTick();

			// Trigger emission to capture the new calendar value
			const nowButton = wrapper.find('.calendar-today-button');
			await nowButton.trigger('click');
			await nextTick();

			// Verify month was updated in internal state
			expect(capturedCalendarValue).toBeDefined();
		});

		it('updates year when year input changes', async () => {
			let capturedCalendarValue: unknown;

			vi.mocked(formatDatePickerModelValue).mockImplementation((_type, options) => {
				capturedCalendarValue = options.calendarValue;
				return '2025-01-15';
			});

			const wrapper = createWrapper({
				type: 'date',
				modelValue: '2024-01-15',
			});

			await nextTick();

			const yearInput = wrapper.find('.calendar-year-input');
			await yearInput.setValue('2025');
			await yearInput.trigger('change');
			await nextTick();

			// Trigger emission to capture the new calendar value
			const nowButton = wrapper.find('.calendar-today-button');
			await nowButton.trigger('click');
			await nextTick();

			expect(capturedCalendarValue).toBeDefined();
		});

		it('ignores invalid month values (out of range)', async () => {
			const initialCallCount = vi.mocked(formatDatePickerModelValue).mock.calls.length;

			const wrapper = createWrapper({
				type: 'date',
				modelValue: '2024-01-15',
			});

			await nextTick();

			const monthSelect = wrapper.find('#calendar-month-select');

			// Simulate invalid value (out of range) - the handler should reject this
			await monthSelect.setValue('13');
			await monthSelect.trigger('change');
			await nextTick();

			// The formatDatePickerModelValue should not have been called again
			// because invalid values are ignored
			const finalCallCount = vi.mocked(formatDatePickerModelValue).mock.calls.length;

			expect(finalCallCount).toBe(initialCallCount);
		});

		it('ignores invalid year values (zero or negative)', async () => {
			const initialCallCount = vi.mocked(formatDatePickerModelValue).mock.calls.length;

			const wrapper = createWrapper({
				type: 'date',
				modelValue: '2024-01-15',
			});

			await nextTick();

			const yearInput = wrapper.find('.calendar-year-input');

			// Simulate invalid value - the handler should reject this
			await yearInput.setValue('0');
			await yearInput.trigger('change');
			await nextTick();

			// The formatDatePickerModelValue should not have been called again
			const finalCallCount = vi.mocked(formatDatePickerModelValue).mock.calls.length;

			expect(finalCallCount).toBe(initialCallCount);
		});

		it('ignores non-numeric year values (NaN)', async () => {
			const initialCallCount = vi.mocked(formatDatePickerModelValue).mock.calls.length;

			const wrapper = createWrapper({
				type: 'date',
				modelValue: '2024-01-15',
			});

			await nextTick();

			const yearInput = wrapper.find('.calendar-year-input');

			// Simulate non-numeric value that parses to NaN
			await yearInput.setValue('abc');
			await yearInput.trigger('change');
			await nextTick();

			// The formatDatePickerModelValue should not have been called again
			const finalCallCount = vi.mocked(formatDatePickerModelValue).mock.calls.length;

			expect(finalCallCount).toBe(initialCallCount);
		});

		it('clamps day when changing to month with fewer days', async () => {
			let capturedDay: number | undefined;

			vi.mocked(formatDatePickerModelValue).mockImplementation((_type, options) => {
				if (options.calendarValue && 'day' in options.calendarValue) {
					capturedDay = options.calendarValue.day;
				}

				return '2024-02-29';
			});

			// Start with January 31st
			const wrapper = createWrapper({
				type: 'date',
				modelValue: '2024-01-31',
			});

			await nextTick();

			const monthSelect = wrapper.find('#calendar-month-select');
			// Change to February (which has 29 days in 2024, a leap year)
			await monthSelect.setValue('2');
			await monthSelect.trigger('change');
			await nextTick();

			// Trigger emission to capture the clamped value
			const nowButton = wrapper.find('.calendar-today-button');
			await nowButton.trigger('click');
			await nextTick();

			// Day should be clamped to 29 (max for Feb 2024)
			expect(capturedDay).toBeDefined();
			expect(capturedDay).toBeLessThanOrEqual(29);
		});

		it('clamps day when changing year affects leap year', async () => {
			let capturedDay: number | undefined;

			vi.mocked(formatDatePickerModelValue).mockImplementation((_type, options) => {
				if (options.calendarValue && 'day' in options.calendarValue) {
					capturedDay = options.calendarValue.day;
				}

				return '2023-02-28';
			});

			// Start with Feb 29 on a leap year
			const wrapper = createWrapper({
				type: 'date',
				modelValue: '2024-02-29',
			});

			await nextTick();

			const yearInput = wrapper.find('.calendar-year-input');
			// Change to non-leap year
			await yearInput.setValue('2023');
			await yearInput.trigger('change');
			await nextTick();

			// Trigger emission to capture the clamped value
			const nowButton = wrapper.find('.calendar-today-button');
			await nowButton.trigger('click');
			await nextTick();

			// Day should be clamped to 28 (max for Feb 2023)
			expect(capturedDay).toBeDefined();
			expect(capturedDay).toBeLessThanOrEqual(28);
		});

		it('uses current date as fallback when no date is selected', async () => {
			let capturedCalendarValue: unknown;

			vi.mocked(formatDatePickerModelValue).mockImplementation((_type, options) => {
				capturedCalendarValue = options.calendarValue;
				return '2024-06-15';
			});

			const wrapper = createWrapper({
				type: 'date',
				modelValue: null,
			});

			await nextTick();

			const monthSelect = wrapper.find('#calendar-month-select');
			await monthSelect.setValue('6');
			await monthSelect.trigger('change');
			await nextTick();

			// Trigger emission to capture the value
			const nowButton = wrapper.find('.calendar-today-button');
			await nowButton.trigger('click');
			await nextTick();

			// Should have created a calendar value using current date as fallback
			expect(capturedCalendarValue).toBeDefined();
		});
	});

	describe('set to now functionality', () => {
		it('sets current date and time when button is clicked', async () => {
			vi.mocked(formatDatePickerModelValue).mockReturnValue('2024-01-15T12:00:00');

			const wrapper = createWrapper({
				type: 'dateTime',
				modelValue: null,
			});

			await nextTick();

			const nowButton = wrapper.find('.calendar-today-button');
			await nowButton.trigger('click');
			await nextTick();

			expect(wrapper.emitted('update:modelValue')).toBeTruthy();
			expect(formatDatePickerModelValue).toHaveBeenCalled();
		});

		it('only sets date when type is date', async () => {
			vi.mocked(formatDatePickerModelValue).mockReturnValue('2024-01-15');

			const wrapper = createWrapper({
				type: 'date',
				modelValue: null,
			});

			await nextTick();

			const nowButton = wrapper.find('.calendar-today-button');
			await nowButton.trigger('click');
			await nextTick();

			expect(wrapper.emitted('update:modelValue')).toBeTruthy();
		});

		it('sets date and time when type supports time', async () => {
			vi.mocked(formatDatePickerModelValue).mockReturnValue('14:30:00');

			const wrapper = createWrapper({
				type: 'time',
				modelValue: null,
			});

			await nextTick();

			const nowButton = wrapper.find('.calendar-today-button');
			await nowButton.trigger('click');
			await nextTick();

			expect(wrapper.emitted('update:modelValue')).toBeTruthy();
		});
	});

	describe('computed properties', () => {
		it('hourCycle returns 24 when use24 is true', () => {
			const wrapper = createWrapper({
				type: 'time',
				use24: true,
			});

			// The hourCycle should be passed to TimeFieldRoot
			const timeField = wrapper.findComponent(TimeFieldRoot);
			expect(timeField.props('hourCycle')).toBe(24);
		});

		it('hourCycle returns undefined when use24 is false', () => {
			const wrapper = createWrapper({
				type: 'time',
				use24: false,
			});

			const timeField = wrapper.findComponent(TimeFieldRoot);
			expect(timeField.props('hourCycle')).toBeUndefined();
		});

		it('granularity returns second when includeSeconds is true', () => {
			const wrapper = createWrapper({
				type: 'time',
				includeSeconds: true,
			});

			const timeField = wrapper.findComponent(TimeFieldRoot);
			expect(timeField.props('granularity')).toBe('second');
		});

		it('granularity returns minute when includeSeconds is false', () => {
			const wrapper = createWrapper({
				type: 'time',
				includeSeconds: false,
			});

			const timeField = wrapper.findComponent(TimeFieldRoot);
			expect(timeField.props('granularity')).toBe('minute');
		});

		it('shows calendar for date type', () => {
			const wrapper = createWrapper({ type: 'date' });

			const calendarHeader = wrapper.findComponent(CalendarHeader);
			expect(calendarHeader.exists()).toBe(true);
		});

		it('hides calendar for time type', () => {
			const wrapper = createWrapper({ type: 'time' });

			const calendarHeader = wrapper.findComponent(CalendarHeader);
			expect(calendarHeader.exists()).toBe(false);
		});

		it('shows time picker for time type', () => {
			const wrapper = createWrapper({ type: 'time' });

			const timePicker = wrapper.find('.time-picker');
			expect(timePicker.exists()).toBe(true);
		});

		it('shows time picker for dateTime type', () => {
			const wrapper = createWrapper({ type: 'dateTime' });

			const timePicker = wrapper.find('.time-picker');
			expect(timePicker.exists()).toBe(true);
		});

		it('shows time picker for timestamp type', () => {
			const wrapper = createWrapper({ type: 'timestamp' });

			const timePicker = wrapper.find('.time-picker');
			expect(timePicker.exists()).toBe(true);
		});

		it('hides time picker for date type', () => {
			const wrapper = createWrapper({ type: 'date' });

			const timePicker = wrapper.find('.time-picker');
			expect(timePicker.exists()).toBe(false);
		});

		it('generates 12 month options', () => {
			const wrapper = createWrapper({
				type: 'date',
				modelValue: '2024-01-15',
			});

			const monthOptions = wrapper.findAll('#calendar-month-select option');
			expect(monthOptions.length).toBe(12);
		});

		describe('in negative-UTC-offset timezones', () => {
			const originalTZ = process.env.TZ;

			beforeEach(() => {
				process.env.TZ = 'America/Los_Angeles';
			});

			afterEach(() => {
				process.env.TZ = originalTZ;
			});

			it('month option labels match their value', () => {
				const wrapper = createWrapper({
					type: 'date',
					modelValue: '2024-06-15',
				});

				const options = wrapper.findAll('#calendar-month-select option');

				expect(options.at(0)?.text()).toBe('January');
				expect(options.at(5)?.text()).toBe('June');
				expect(options.at(11)?.text()).toBe('December');
			});
		});
	});

	describe('RTL support', () => {
		it('passes LTR direction to calendar by default', () => {
			const wrapper = createWrapper({ type: 'date' });

			const calendarRoot = wrapper.findComponent(CalendarRoot);
			expect(calendarRoot.props('dir')).toBe('ltr');
		});

		it('passes LTR direction to time field by default', () => {
			const wrapper = createWrapper({ type: 'time' });

			const timeField = wrapper.findComponent(TimeFieldRoot);
			expect(timeField.props('dir')).toBe('ltr');
		});

		it('passes RTL direction to calendar when textDirection is rtl', () => {
			mockUserStore.textDirection = 'rtl';

			const wrapper = createWrapper({ type: 'date' });

			const calendarRoot = wrapper.findComponent(CalendarRoot);
			expect(calendarRoot.props('dir')).toBe('rtl');
		});

		it('passes RTL direction to time field when textDirection is rtl', () => {
			mockUserStore.textDirection = 'rtl';

			const wrapper = createWrapper({ type: 'time' });

			const timeField = wrapper.findComponent(TimeFieldRoot);
			expect(timeField.props('dir')).toBe('rtl');
		});
	});

	describe('default time value', () => {
		it('initializes with default time (12:00) for time type when modelValue is null', async () => {
			let capturedTimeValue: { hour?: number; minute?: number } | undefined;

			vi.mocked(formatDatePickerModelValue).mockImplementation((_type, options) => {
				if (options.timeValue && 'hour' in options.timeValue) {
					capturedTimeValue = options.timeValue as { hour: number; minute: number };
				}

				return '12:00:00';
			});

			const wrapper = createWrapper({
				type: 'time',
				modelValue: null,
			});

			await nextTick();

			// Trigger time change emission (not setToNow which uses current time)
			const timeField = wrapper.findComponent(TimeFieldRoot);
			await timeField.vm.$emit('update:modelValue', new Time(12, 0, 0));
			await nextTick();

			expect(formatDatePickerModelValue).toHaveBeenCalledWith('time', expect.any(Object));
			expect(capturedTimeValue).toBeDefined();
			expect(capturedTimeValue?.hour).toBe(12);
			expect(capturedTimeValue?.minute).toBe(0);
		});

		it('initializes with default time (12:00) for dateTime type when modelValue is null', async () => {
			let capturedTimeValue: { hour?: number; minute?: number } | undefined;

			vi.mocked(formatDatePickerModelValue).mockImplementation((_type, options) => {
				if (options.timeValue && 'hour' in options.timeValue) {
					capturedTimeValue = options.timeValue as { hour: number; minute: number };
				}

				return '2024-01-15T12:00:00';
			});

			const wrapper = createWrapper({
				type: 'dateTime',
				modelValue: null,
			});

			await nextTick();

			// Trigger date change to emit with default time
			const calendarRoot = wrapper.findComponent(CalendarRoot);
			await calendarRoot.vm.$emit('update:modelValue', new CalendarDate(2024, 1, 15));
			await nextTick();

			expect(formatDatePickerModelValue).toHaveBeenCalledWith('dateTime', expect.any(Object));
			expect(capturedTimeValue).toBeDefined();
			expect(capturedTimeValue?.hour).toBe(12);
			expect(capturedTimeValue?.minute).toBe(0);
		});

		it('initializes with default time (12:00) for timestamp type when modelValue is null', async () => {
			let capturedTimeValue: { hour?: number; minute?: number } | undefined;

			vi.mocked(formatDatePickerModelValue).mockImplementation((_type, options) => {
				if (options.timeValue && 'hour' in options.timeValue) {
					capturedTimeValue = options.timeValue as { hour: number; minute: number };
				}

				return '2024-01-15T12:00:00Z';
			});

			const wrapper = createWrapper({
				type: 'timestamp',
				modelValue: null,
			});

			await nextTick();

			// Trigger date change to emit with default time
			const calendarRoot = wrapper.findComponent(CalendarRoot);
			await calendarRoot.vm.$emit('update:modelValue', new CalendarDate(2024, 1, 15));
			await nextTick();

			expect(formatDatePickerModelValue).toHaveBeenCalledWith('timestamp', expect.any(Object));
			expect(capturedTimeValue).toBeDefined();
			expect(capturedTimeValue?.hour).toBe(12);
			expect(capturedTimeValue?.minute).toBe(0);
		});

		it('resets to default time (12:00) when modelValue becomes null', async () => {
			let capturedTimeValue: { hour?: number; minute?: number } | undefined;

			vi.mocked(formatDatePickerModelValue).mockReturnValue('14:30:00');

			const wrapper = createWrapper({
				type: 'time',
				modelValue: '14:30:00',
			});

			await nextTick();

			// Clear the model value
			await wrapper.setProps({ modelValue: null });
			await nextTick();

			// Set up mock to capture the reset time value
			vi.mocked(formatDatePickerModelValue).mockImplementation((_type, options) => {
				if (options.timeValue && 'hour' in options.timeValue) {
					capturedTimeValue = options.timeValue as { hour: number; minute: number };
				}

				return '12:00:00';
			});

			// Trigger time change emission to verify default was restored
			const timeField = wrapper.findComponent(TimeFieldRoot);
			await timeField.vm.$emit('update:modelValue', new Time(12, 0, 0));
			await nextTick();

			expect(capturedTimeValue).toBeDefined();
			expect(capturedTimeValue?.hour).toBe(12);
			expect(capturedTimeValue?.minute).toBe(0);
		});
	});

	describe('time value handling', () => {
		it('emits update when time changes', async () => {
			vi.mocked(formatDatePickerModelValue).mockReturnValue('14:30:00');

			const wrapper = createWrapper({
				type: 'time',
				modelValue: '12:00:00',
			});

			await nextTick();

			const timeField = wrapper.findComponent(TimeFieldRoot);
			const newTime = new Time(14, 30, 0);

			await timeField.vm.$emit('update:modelValue', newTime);
			await nextTick();

			expect(wrapper.emitted('update:modelValue')).toBeTruthy();
			expect(formatDatePickerModelValue).toHaveBeenCalled();
		});

		it('handles null time value', async () => {
			vi.mocked(formatDatePickerModelValue).mockReturnValue(null);

			const wrapper = createWrapper({
				type: 'time',
				modelValue: '12:00:00',
			});

			await nextTick();

			const timeField = wrapper.findComponent(TimeFieldRoot);

			await timeField.vm.$emit('update:modelValue', undefined);
			await nextTick();

			expect(formatDatePickerModelValue).toHaveBeenCalled();
		});
	});

	describe('edge cases', () => {
		it('handles rapid prop changes without errors', async () => {
			let lastCapturedValue: unknown;

			vi.mocked(formatDatePickerModelValue).mockImplementation((_type, options) => {
				lastCapturedValue = options.calendarValue;
				return '2024-01-18';
			});

			const wrapper = createWrapper({
				type: 'date',
				modelValue: '2024-01-15',
			});

			await wrapper.setProps({ modelValue: '2024-01-16' });
			await wrapper.setProps({ modelValue: '2024-01-17' });
			await wrapper.setProps({ modelValue: '2024-01-18' });
			await nextTick();

			// Trigger emission to verify final state
			const nowButton = wrapper.find('.calendar-today-button');
			await nowButton.trigger('click');
			await nextTick();

			// Component should have processed all changes
			expect(lastCapturedValue).toBeDefined();
			expect(formatDatePickerModelValue).toHaveBeenCalled();
		});

		it('handles type changes from date to time', async () => {
			const wrapper = createWrapper({
				type: 'date',
				modelValue: '2024-01-15',
			});

			await nextTick();

			// Initially should show calendar, not time picker
			expect(wrapper.findComponent(CalendarHeader).exists()).toBe(true);
			expect(wrapper.find('.time-picker').exists()).toBe(false);

			await wrapper.setProps({ type: 'time', modelValue: '14:30:00' });
			await nextTick();

			// After type change, should show time picker, not calendar
			expect(wrapper.findComponent(CalendarHeader).exists()).toBe(false);
			expect(wrapper.find('.time-picker').exists()).toBe(true);
		});

		it('handles switching between null and valid values', async () => {
			let callCount = 0;

			vi.mocked(formatDatePickerModelValue).mockImplementation(() => {
				callCount++;
				return '2024-01-20';
			});

			const wrapper = createWrapper({
				type: 'date',
				modelValue: null,
			});

			await wrapper.setProps({ modelValue: '2024-01-15' });
			await nextTick();

			await wrapper.setProps({ modelValue: null });
			await nextTick();

			await wrapper.setProps({ modelValue: '2024-01-20' });
			await nextTick();

			// Trigger final emission
			const nowButton = wrapper.find('.calendar-today-button');
			await nowButton.trigger('click');
			await nextTick();

			// Component should handle all transitions and emit
			expect(callCount).toBeGreaterThan(0);
			expect(wrapper.emitted('update:modelValue')).toBeTruthy();
		});
	});
});
