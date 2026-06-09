import { CalendarDate } from '@internationalized/date';
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

const createWrapper = (props = {}) => {
	return mount(DatePickerField, {
		props: {
			type: 'date',
			...props,
		},
		global: {
			stubs: { DateFieldRoot, DateFieldInput },
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

	it('emits the formatted date string when a date is typed', async () => {
		const wrapper = createWrapper({ type: 'date', modelValue: '2024-01-15' });

		await wrapper.findComponent(DateFieldRoot).vm.$emit('update:modelValue', new CalendarDate(2024, 3, 9));
		await nextTick();

		expect(wrapper.emitted('update:modelValue')).toEqual([['2024-03-09']]);
	});

	it('does not emit when the typed year has fewer than four digits', async () => {
		const wrapper = createWrapper({ type: 'date', modelValue: '2024-01-15' });

		await wrapper.findComponent(DateFieldRoot).vm.$emit('update:modelValue', new CalendarDate(123, 3, 9));
		await nextTick();

		expect(wrapper.emitted('update:modelValue')).toBeFalsy();
	});

	it('preserves the existing time when only the date is edited for dateTime', async () => {
		const wrapper = createWrapper({ type: 'dateTime', modelValue: '2024-01-15T14:30:00' });

		await wrapper.findComponent(DateFieldRoot).vm.$emit('update:modelValue', new CalendarDate(2024, 3, 9));
		await nextTick();

		expect(wrapper.emitted('update:modelValue')).toEqual([['2024-03-09T14:30:00']]);
	});

	it('passes day granularity and user locale to the field', () => {
		mockUserStore.language = 'en-GB';

		const wrapper = createWrapper({ type: 'dateTime', modelValue: '2024-01-15T14:30:00' });

		const field = wrapper.findComponent(DateFieldRoot);
		expect(field.props('granularity')).toBe('day');
		expect(field.props('locale')).toBe('en-GB');
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
});
