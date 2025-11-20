import { Focus } from '@/__utils__/focus';
import type { GlobalMountOptions } from '@/__utils__/types';
import { i18n } from '@/lang';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, test, vi } from 'vitest';
import VInput from './v-input.vue';
import Tooltip from '@/directives/tooltip';

const global: GlobalMountOptions = {
	stubs: ['v-icon'],
	plugins: [i18n],
	directives: {
		focus: Focus,
		tooltip: Tooltip,
	},
};

test('Mount component', () => {
	expect(VInput).toBeTruthy();

	const wrapper = mount(VInput, {
		global,
	});

	expect(wrapper.html()).toMatchSnapshot();
});

test('modelValue prop', async () => {
	const wrapper = mount(VInput, {
		props: {
			modelValue: 'my value',
		},
		global,
	});

	expect(wrapper.get('input').element.value).toBe('my value');

	await wrapper.find('input').setValue('my value1');

	expect(wrapper.emitted()['update:modelValue']?.[0]).toEqual(['my value1']);
});

test('modelValue trim', async () => {
	const wrapper = mount(VInput, {
		props: {
			modelValue: '  please trim that beard    ',
			trim: true,
		},
		global,
	});

	await wrapper.find('input').trigger('blur');

	expect(wrapper.emitted()['update:modelValue']?.[0]).toEqual(['please trim that beard']);
});

test('modelValue dbSafe', async () => {
	const wrapper = mount(VInput, {
		props: {
			modelValue: 'this $hould be Dß save!!',
			dbSafe: true,
		},
		global,
	});

	await wrapper.find('input').trigger('input');

	expect(wrapper.emitted()['update:modelValue']?.[0]).toEqual(['this_hould_be_D_save']);
});

describe('processValue', () => {
	const commonTestScenarios = [
		{
			scenario: 'should allow slug safe characters',
			event: { key: 'a' },
			shouldDefaultPrevented: false,
		},
		{
			scenario: 'should not allow non slug safe characters',
			event: { key: '$' },
			shouldDefaultPrevented: true,
		},
		{
			scenario: 'should allow system keys',
			event: { key: 'Control' }, // also tests whether "Control" is mapped to "meta"
			shouldDefaultPrevented: false,
		},
		{
			scenario: 'should allow arrow keys',
			event: { key: 'ArrowUp' },
			shouldDefaultPrevented: false,
		},
	];

	test.each([
		...commonTestScenarios,
		{
			scenario: 'should not allow trailing space after the slug separator',
			event: { key: ' ' },
			shouldDefaultPrevented: true,
		},
	])('slug input %scenario', async ({ event, shouldDefaultPrevented }) => {
		const wrapper = mount(VInput, {
			props: {
				// default slug separator to test the "should not allow trailing space after slug separator" scenario
				modelValue: '-',
				slug: true,
			},
			global,
		});

		const input = wrapper.find('input');

		await input.trigger('keydown', event);

		const keyboardEvent = wrapper.emitted('keydown')?.[0]?.[0] as KeyboardEvent;

		expect(keyboardEvent.defaultPrevented).toBe(shouldDefaultPrevented);
	});

	test.each([
		...commonTestScenarios,
		{
			scenario: 'should allow system key combinations with number when entering the first character',
			event: { key: '1', shiftKey: true },
			shouldDefaultPrevented: false,
		},
		{
			scenario: 'should not allow number when entering the first character',
			event: { key: '1' },
			shouldDefaultPrevented: true,
		},
	])('dbSafe input %scenario', async ({ event, shouldDefaultPrevented }) => {
		const wrapper = mount(VInput, {
			props: {
				dbSafe: true,
			},
			global,
		});

		const input = wrapper.find('input');

		await input.trigger('keydown', event);

		const keyboardEvent = wrapper.emitted('keydown')?.[0]?.[0] as KeyboardEvent;

		expect(keyboardEvent.defaultPrevented).toBe(shouldDefaultPrevented);
	});
});

describe('emitValue', () => {
	test('should emit null value when empty', async () => {
		const wrapper = mount(VInput, {
			props: {
				modelValue: '',
				nullable: true,
			},
			global,
		});

		await wrapper.find('input').trigger('input');

		expect(wrapper.emitted()['update:modelValue']?.[0]).toEqual([null]);
	});

	test('should emit number when type is number', async () => {
		const wrapper = mount(VInput, {
			props: {
				type: 'number',
				modelValue: '1',
			},
			global,
		});

		await wrapper.find('input').trigger('input');

		expect(wrapper.emitted()['update:modelValue']?.[0]).toEqual([1]);
	});

	test('should replace "," with "." for decimal separator when decimal types marked as text', async () => {
		const wrapper = mount(VInput, {
			props: {
				type: 'text',
				modelValue: '1,22',
				float: true,
			},
			global,
		});

		await wrapper.find('input').trigger('input');

		expect(wrapper.emitted()['update:modelValue']?.[0]).toEqual(['1.22']);
	});

	test('should emit number without a thousandths separator', async () => {
		const wrapper = mount(VInput, {
			props: {
				type: 'text',
				modelValue: '1,222,220',
				float: true,
			},
			global,
		});

		await wrapper.find('input').trigger('input');

		expect(wrapper.emitted()['update:modelValue']?.[0]).toEqual(['1.222220']);
	});

	test('should turn ending space into slug separator for slug input', async () => {
		const wrapper = mount(VInput, {
			props: {
				modelValue: 'test ',
				slug: true,
			},
			global,
		});

		await wrapper.find('input').trigger('input');

		expect(wrapper.emitted()['update:modelValue']?.[0]).toEqual(['test-']);
	});

	test('should turn space into underscores for dbSafe input', async () => {
		const wrapper = mount(VInput, {
			props: {
				modelValue: 'a custom field',
				dbSafe: true,
			},
			global,
		});

		await wrapper.find('input').trigger('input');

		expect(wrapper.emitted()['update:modelValue']?.[0]).toEqual(['a_custom_field']);
	});

	test('should prevent pasting of non db safe characters for dbSafe input', async () => {
		const wrapper = mount(VInput, {
			props: {
				modelValue: '$test_field',
				dbSafe: true,
			},
			global,
		});

		await wrapper.find('input').trigger('input');

		expect(wrapper.emitted()['update:modelValue']?.[0]).toEqual(['test_field']);
	});

	test('should normalize accented characters for dbSafe input', async () => {
		const wrapper = mount(VInput, {
			props: {
				modelValue: 'à_test_field',
				dbSafe: true,
			},
			global,
		});

		await wrapper.find('input').trigger('input');

		expect(wrapper.emitted()['update:modelValue']?.[0]).toEqual(['a_test_field']);
	});
});

describe('invalid warning', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	const validityMock: ValidityState = {
		badInput: false,
		customError: false,
		patternMismatch: false,
		rangeOverflow: false,
		rangeUnderflow: false,
		stepMismatch: false,
		tooLong: false,
		tooShort: false,
		typeMismatch: false,
		valid: true,
		valueMissing: false,
	};

	test('should appear for invalid input', async () => {
		const wrapper = mount(VInput, {
			props: {
				type: 'number',
				integer: true,
			},
			global,
		});

		const input = wrapper.find('input');
		const inputEl = input.element as HTMLInputElement;
		const validitySpy = vi.spyOn(inputEl, 'validity', 'get').mockReturnValue({ ...validityMock, badInput: true });

		expect(inputEl.validity.badInput).toBe(true);
		expect((wrapper.vm as any).isInvalidInput).toBe(false);

		await input.trigger('input');
		await wrapper.vm.$nextTick();

		expect((wrapper.vm as any).isInvalidInput).toBe(true);
		expect(wrapper.find('.v-input.invalid').exists()).toBe(true);
		expect(wrapper.find('v-icon-stub.warning-invalid').exists()).toBe(true);
		expect(validitySpy).toHaveBeenCalledTimes(2);

		expect(wrapper.html()).toMatchSnapshot();
	});

	test('should not appear for valid input', async () => {
		const wrapper = mount(VInput, {
			props: {
				type: 'number',
				integer: true,
			},
			global,
		});

		const input = wrapper.find('input');
		const inputEl = input.element as HTMLInputElement;
		const validitySpy = vi.spyOn(inputEl, 'validity', 'get').mockReturnValue(validityMock);

		expect(inputEl.validity.badInput).toBe(false);
		expect((wrapper.vm as any).isInvalidInput).toBe(false);

		await input.trigger('input');
		await wrapper.vm.$nextTick();

		expect((wrapper.vm as any).isInvalidInput).toBe(false);
		expect(wrapper.find('.v-input.invalid').exists()).toBe(false);
		expect(wrapper.find('v-icon-stub.warning-invalid').exists()).toBe(false);
		expect(validitySpy).toHaveBeenCalledTimes(2);

		expect(wrapper.html()).toMatchSnapshot();
	});

	test('should appear when value exceeds maximum', async () => {
		const wrapper = mount(VInput, {
			props: {
				type: 'number',
				modelValue: 15,
				min: 0,
				max: 10,
				integer: true,
			},
			global,
		});

		await wrapper.vm.$nextTick();

		expect((wrapper.vm as any).isInvalidRange).toBe(true);
		expect(wrapper.find('.v-input.invalid').exists()).toBe(true);
		expect(wrapper.find('v-icon-stub.warning-invalid').exists()).toBe(true);
	});

	test('should appear when value is below minimum', async () => {
		const wrapper = mount(VInput, {
			props: {
				type: 'number',
				modelValue: -5,
				min: 0,
				max: 10,
				integer: true,
			},
			global,
		});

		await wrapper.vm.$nextTick();

		expect((wrapper.vm as any).isInvalidRange).toBe(true);
		expect(wrapper.find('.v-input.invalid').exists()).toBe(true);
	});

	test('should not appear when value is within range', async () => {
		const wrapper = mount(VInput, {
			props: {
				type: 'number',
				modelValue: 5,
				min: 0,
				max: 10,
				integer: true,
			},
			global,
		});

		await wrapper.vm.$nextTick();

		expect((wrapper.vm as any).isInvalidRange).toBe(false);
		expect(wrapper.find('.v-input.invalid').exists()).toBe(false);
	});

	test('should work with decimal values for float type', async () => {
		const wrapper = mount(VInput, {
			props: {
				type: 'number',
				modelValue: 10.5,
				min: 0.5,
				max: 10,
				float: true,
			},
			global,
		});

		await wrapper.vm.$nextTick();

		expect((wrapper.vm as any).isInvalidRange).toBe(true);
		expect(wrapper.find('.v-input.invalid').exists()).toBe(true);
	});

	test('useInvalidInput takes priority over useInvalidRange', async () => {
		const wrapper = mount(VInput, {
			props: {
				type: 'number',
				modelValue: 15,
				min: 0,
				max: 10,
				integer: true,
			},
			global,
		});

		const input = wrapper.find('input');
		const inputEl = input.element as HTMLInputElement;

		vi.spyOn(inputEl, 'validity', 'get').mockReturnValue({
			badInput: true,
		} as ValidityState);

		await input.trigger('input');
		await wrapper.vm.$nextTick();

		expect((wrapper.vm as any).isInvalidInput).toBe(true);
		expect(wrapper.find('.v-input.invalid').exists()).toBe(true);
	});
});
