import { CalendarDate, Time } from '@internationalized/date';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import DatePickerField from './date-picker-field.vue';

const mockUserStore = {
	language: 'en-US',
	textDirection: 'ltr',
};

vi.mock('@/stores/user', () => ({
	useUserStore: vi.fn(() => mockUserStore),
}));

// Reka UI DateField stub that lets us drive `update:modelValue` and renders the segments slot.
const DateFieldRoot = {
	name: 'DateFieldRoot',
	template: `
		<div class="date-field-stub">
			<slot :segments="[
				{ part: 'month', value: '01' },
				{ part: 'literal', value: '/' },
				{ part: 'day', value: '15' },
				{ part: 'literal', value: '/' },
				{ part: 'year', value: '2024' }
			]" />
		</div>
	`,
	props: ['modelValue', 'granularity', 'locale', 'dir', 'disabled', 'ariaLabel'],
	emits: ['update:modelValue'],
};

const DateFieldInput = {
	name: 'DateFieldInput',
	template: '<span class="date-field-input-stub"><slot /></span>',
	props: ['part'],
};

// Reka UI TimeField stub mirroring the DateField stub: drives `update:modelValue` and renders segments.
const TimeFieldRoot = {
	name: 'TimeFieldRoot',
	template: `
		<div class="time-field-stub">
			<slot :segments="[
				{ part: 'hour', value: '02' },
				{ part: 'literal', value: ':' },
				{ part: 'minute', value: '30' }
			]" />
		</div>
	`,
	props: ['modelValue', 'granularity', 'hourCycle', 'dir', 'disabled'],
	emits: ['update:modelValue'],
};

const TimeFieldInput = {
	name: 'TimeFieldInput',
	template: '<span class="time-field-input-stub"><slot /></span>',
	props: ['part'],
};

const createWrapper = (props = {}) => {
	return mount(DatePickerField, {
		props: {
			type: 'date',
			...props,
		},
		global: {
			stubs: { DateFieldRoot, DateFieldInput, TimeFieldRoot, TimeFieldInput },
			mocks: { $t: (key: string) => key },
		},
	});
};

describe('date-picker-field', () => {
	beforeEach(() => {
		mockUserStore.language = 'en-US';
		mockUserStore.textDirection = 'ltr';
	});

	it('renders the date field segments', () => {
		const wrapper = createWrapper({ modelValue: '2024-01-15' });

		expect(wrapper.findComponent(DateFieldRoot).exists()).toBe(true);
		expect(wrapper.findAll('.date-field-segment').length).toBe(3);
	});

	it('renders without throwing when the value is malformed for the type', () => {
		// A bare date string for a `timestamp` makes the parser throw; the field must
		// fall back to the empty state rather than crash during setup.
		expect(() => createWrapper({ type: 'timestamp', modelValue: 'not-a-date' })).not.toThrow();
	});

	it('preserves the existing time when only the date is edited for dateTime', async () => {
		const wrapper = createWrapper({ type: 'dateTime', modelValue: '2024-01-15T14:30:00' });

		await wrapper.findComponent(DateFieldRoot).vm.$emit('update:modelValue', new CalendarDate(2024, 3, 9));
		await nextTick();

		expect(wrapper.emitted('update:modelValue')).toEqual([['2024-03-09T14:30:00']]);
	});

	it('ignores partial years (under 1000) while the year segment is being typed', async () => {
		const wrapper = createWrapper({ type: 'dateTime', modelValue: '2024-01-15T14:30:00' });

		// Reka emits these intermediate values as the user types "2025" over the year.
		await wrapper.findComponent(DateFieldRoot).vm.$emit('update:modelValue', new CalendarDate(2, 1, 15));
		await wrapper.findComponent(DateFieldRoot).vm.$emit('update:modelValue', new CalendarDate(202, 1, 15));
		await nextTick();

		expect(wrapper.emitted('update:modelValue')).toBeUndefined();

		// Once all four digits are entered the value is applied.
		await wrapper.findComponent(DateFieldRoot).vm.$emit('update:modelValue', new CalendarDate(2025, 1, 15));
		await nextTick();

		expect(wrapper.emitted('update:modelValue')).toEqual([['2025-01-15T14:30:00']]);
	});

	it('passes the user locale to the field', () => {
		mockUserStore.language = 'en-GB';

		const wrapper = createWrapper({ type: 'dateTime', modelValue: '2024-01-15T14:30:00' });

		expect(wrapper.findComponent(DateFieldRoot).props('locale')).toBe('en-GB');
	});

	it('passes RTL direction when the user text direction is rtl', () => {
		mockUserStore.textDirection = 'rtl';

		const wrapper = createWrapper({ modelValue: '2024-01-15' });

		expect(wrapper.findComponent(DateFieldRoot).props('dir')).toBe('rtl');
	});

	it('passes the disabled prop through to the field', () => {
		const wrapper = createWrapper({ modelValue: '2024-01-15', disabled: true });

		expect(wrapper.findComponent(DateFieldRoot).props('disabled')).toBe(true);
	});

	describe('inline time field', () => {
		it('renders a time field for dateTime and timestamp', () => {
			const dateTime = createWrapper({ type: 'dateTime', modelValue: '2024-01-15T14:30:00' });
			expect(dateTime.findComponent(TimeFieldRoot).exists()).toBe(true);

			const timestamp = createWrapper({ type: 'timestamp', modelValue: '2024-01-15T14:30:00.000Z' });
			expect(timestamp.findComponent(TimeFieldRoot).exists()).toBe(true);
		});

		it('does not render a time field for the date type', () => {
			const wrapper = createWrapper({ type: 'date', modelValue: '2024-01-15' });

			expect(wrapper.findComponent(TimeFieldRoot).exists()).toBe(false);
		});

		it('renders only the time field for the time type', () => {
			const wrapper = createWrapper({ type: 'time', modelValue: '14:30:00' });

			expect(wrapper.findComponent(TimeFieldRoot).exists()).toBe(true);
			expect(wrapper.findComponent(DateFieldRoot).exists()).toBe(false);
		});

		it('emits the time when only the time is edited (time type)', async () => {
			const wrapper = createWrapper({ type: 'time', modelValue: '14:30:00' });

			await wrapper.findComponent(TimeFieldRoot).vm.$emit('update:modelValue', new Time(9, 15, 0));
			await nextTick();

			expect(wrapper.emitted('update:modelValue')).toEqual([['09:15:00']]);
		});

		it('emits the combined value preserving the date when only the time is edited (dateTime)', async () => {
			const wrapper = createWrapper({ type: 'dateTime', modelValue: '2024-01-15T14:30:00' });

			await wrapper.findComponent(TimeFieldRoot).vm.$emit('update:modelValue', new Time(9, 0, 0));
			await nextTick();

			expect(wrapper.emitted('update:modelValue')).toEqual([['2024-01-15T09:00:00']]);
		});

		it('emits the combined value preserving the date when only the time is edited (timestamp)', async () => {
			vi.stubEnv('TZ', 'UTC');

			const wrapper = createWrapper({ type: 'timestamp', modelValue: '2024-01-15T14:30:00.000Z' });

			await wrapper.findComponent(TimeFieldRoot).vm.$emit('update:modelValue', new Time(9, 0, 0));
			await nextTick();

			expect(wrapper.emitted('update:modelValue')).toEqual([['2024-01-15T09:00:00.000Z']]);

			vi.unstubAllEnvs();
		});

		it('uses minute granularity and a 24-hour cycle by default', () => {
			const wrapper = createWrapper({ type: 'dateTime', modelValue: '2024-01-15T14:30:00' });

			const field = wrapper.findComponent(TimeFieldRoot);
			expect(field.props('granularity')).toBe('minute');
			expect(field.props('hourCycle')).toBe(24);
		});

		it('uses second granularity when includeSeconds is set', () => {
			const wrapper = createWrapper({ type: 'dateTime', modelValue: '2024-01-15T14:30:00', includeSeconds: true });

			expect(wrapper.findComponent(TimeFieldRoot).props('granularity')).toBe('second');
		});

		it('omits the hour cycle when use24 is false (12-hour day period)', () => {
			const wrapper = createWrapper({ type: 'dateTime', modelValue: '2024-01-15T14:30:00', use24: false });

			expect(wrapper.findComponent(TimeFieldRoot).props('hourCycle')).toBeUndefined();
		});
	});

	describe('empty placeholder', () => {
		it('leaves both fields empty so the segments render as placeholders', () => {
			const wrapper = createWrapper({ type: 'dateTime', modelValue: null });

			expect(wrapper.findComponent(DateFieldRoot).props('modelValue')).toBeUndefined();
			expect(wrapper.findComponent(TimeFieldRoot).props('modelValue')).toBeFalsy();
		});

		it('defaults the time to noon when a date is picked without a time', async () => {
			const wrapper = createWrapper({ type: 'dateTime', modelValue: null });

			await wrapper.findComponent(DateFieldRoot).vm.$emit('update:modelValue', new CalendarDate(2024, 3, 9));
			await nextTick();

			expect(wrapper.emitted('update:modelValue')).toEqual([['2024-03-09T12:00:00']]);
		});
	});
});
