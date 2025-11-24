import { Focus } from '@/__utils__/focus';
import { Tooltip } from '@/__utils__/tooltip';
import type { GlobalMountOptions } from '@/__utils__/types';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, test, vi } from 'vitest';
import VInput from './v-input.vue';

const i18n = {
	not_a_number: 'Not a Number',
	invalid_input: 'Invalid Input',
	invalid_range_min: (value: number) => `Value is below minimum of ${value}`,
	invalid_range_max: (value: number) => `Value exceeds maximum of ${value}`,
}

const tMock = vi.fn((key: string, params?: any) => {
	if (key === 'not_a_number') return i18n.not_a_number;
	if (key === 'invalid_input') return i18n.invalid_input;
	if (key === 'invalid_range_min') return i18n.invalid_range_min(params?.value);
	if (key === 'invalid_range_max') return i18n.invalid_range_max(params?.value);
	return key;
});

vi.mock('vue-i18n', () => ({
	useI18n: () => ({
		t: tMock,
	}),
}));

const global: GlobalMountOptions = {
	stubs: ['v-icon'],
	directives: {
		focus: Focus,
		tooltip: Tooltip,
	},
};

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
		tMock.mockClear();
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
		expect((wrapper.vm as any).isBadInput).toBe(false);

		await input.trigger('input');
		await wrapper.vm.$nextTick();

		expect((wrapper.vm as any).isBadInput).toBe(true);
		expect(wrapper.find('.v-input.invalid').exists()).toBe(true);
		expect(wrapper.find('v-icon-stub.inline-warning').exists()).toBe(true);
		expect(validitySpy).toHaveBeenCalledTimes(2);

		expect(tMock).toHaveBeenCalledWith('not_a_number');
		expect((wrapper.vm as any).inlineWarning).toBe(i18n.not_a_number);

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
		expect((wrapper.vm as any).isBadInput).toBe(false);

		await input.trigger('input');
		await wrapper.vm.$nextTick();

		expect((wrapper.vm as any).isBadInput).toBe(false);
		expect(wrapper.find('.v-input.invalid').exists()).toBe(false);
		expect(wrapper.find('v-icon-stub.inline-warning').exists()).toBe(false);
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

		expect((wrapper.vm as any).inlineWarning).toBeDefined();
		expect(wrapper.find('v-icon-stub.inline-warning').exists()).toBe(true);
		expect(tMock).toHaveBeenCalledWith('invalid_range_max', { value: 10 });
		expect((wrapper.vm as any).inlineWarning).toBe(i18n.invalid_range_max(10));
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

		expect((wrapper.vm as any).inlineWarning).toBeDefined();
		expect(wrapper.find('v-icon-stub.inline-warning').exists()).toBe(true);
		expect(tMock).toHaveBeenCalledWith('invalid_range_min', { value: 0 });
		expect((wrapper.vm as any).inlineWarning).toBe(i18n.invalid_range_min(0));
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

		expect((wrapper.vm as any).inlineWarning).toBeUndefined();
		expect(wrapper.find('v-icon-stub.inline-warning').exists()).toBe(false);
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

		expect((wrapper.vm as any).inlineWarning).toBeDefined();
		expect(wrapper.find('v-icon-stub.inline-warning').exists()).toBe(true);
		expect(tMock).toHaveBeenCalledWith('invalid_range_max', { value: 10 });
		expect((wrapper.vm as any).inlineWarning).toBe(i18n.invalid_range_max(10));
	});

	test('should show invalid_input key for non-number type', async () => {
		const wrapper = mount(VInput, {
			props: {
				type: 'text',
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

		expect(tMock).toHaveBeenCalledWith('invalid_input');
		expect((wrapper.vm as any).inlineWarning).toBe(i18n.invalid_input);
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

		expect((wrapper.vm as any).isBadInput).toBe(true);
		expect(wrapper.find('.v-input.invalid').exists()).toBe(true);
	});
});

describe('step controls', () => {
	test('isStepUpAllowed should work with integer values', async () => {
		const wrapper = mount(VInput, {
			props: {
				type: 'number',
				modelValue: 5,
				max: 10,
				integer: true,
			},
			global,
		});

		expect((wrapper.vm as any).isStepUpAllowed).toBe(true);
	});

	test('isStepUpAllowed should work with float values', async () => {
		const wrapper = mount(VInput, {
			props: {
				type: 'number',
				modelValue: 5.5,
				max: 10,
				float: true,
			},
			global,
		});

		expect((wrapper.vm as any).isStepUpAllowed).toBe(true);
	});

	test('isStepUpAllowed should be false when at max', async () => {
		const wrapper = mount(VInput, {
			props: {
				type: 'number',
				modelValue: 10,
				max: 10,
				integer: true,
			},
			global,
		});

		expect((wrapper.vm as any).isStepUpAllowed).toBe(false);
	});

	test('isStepUpAllowed should be false when exceeding max', async () => {
		const wrapper = mount(VInput, {
			props: {
				type: 'number',
				modelValue: 10.5,
				max: 10,
				float: true,
			},
			global,
		});

		expect((wrapper.vm as any).isStepUpAllowed).toBe(false);
	});

	test('isStepDownAllowed should work with integer values', async () => {
		const wrapper = mount(VInput, {
			props: {
				type: 'number',
				modelValue: 5,
				min: 0,
				integer: true,
			},
			global,
		});

		expect((wrapper.vm as any).isStepDownAllowed).toBe(true);
	});

	test('isStepDownAllowed should work with float values', async () => {
		const wrapper = mount(VInput, {
			props: {
				type: 'number',
				modelValue: 5.5,
				min: 0,
				float: true,
			},
			global,
		});

		expect((wrapper.vm as any).isStepDownAllowed).toBe(true);
	});

	test('isStepDownAllowed should be false when at min', async () => {
		const wrapper = mount(VInput, {
			props: {
				type: 'number',
				modelValue: 0,
				min: 0,
				integer: true,
			},
			global,
		});

		expect((wrapper.vm as any).isStepDownAllowed).toBe(false);
	});

	test('isStepDownAllowed should be false when below min', async () => {
		const wrapper = mount(VInput, {
			props: {
				type: 'number',
				modelValue: -0.5,
				min: 0,
				float: true,
			},
			global,
		});

		expect((wrapper.vm as any).isStepDownAllowed).toBe(false);
	});

	test('isStepUpAllowed should be true when no max is set', async () => {
		const wrapper = mount(VInput, {
			props: {
				type: 'number',
				modelValue: 100,
				integer: true,
			},
			global,
		});

		expect((wrapper.vm as any).isStepUpAllowed).toBe(true);
	});

	test('isStepDownAllowed should be true when no min is set', async () => {
		const wrapper = mount(VInput, {
			props: {
				type: 'number',
				modelValue: -100,
				integer: true,
			},
			global,
		});

		expect((wrapper.vm as any).isStepDownAllowed).toBe(true);
	});

	test('step controls should be disabled when input is disabled', async () => {
		const wrapper = mount(VInput, {
			props: {
				type: 'number',
				modelValue: 5,
				min: 0,
				max: 10,
				disabled: true,
				integer: true,
			},
			global,
		});

		expect((wrapper.vm as any).isStepUpAllowed).toBe(false);
		expect((wrapper.vm as any).isStepDownAllowed).toBe(false);
	});
});
