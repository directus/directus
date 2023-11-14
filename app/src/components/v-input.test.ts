import { Focus } from '@/__utils__/focus';
import type { GlobalMountOptions } from '@/__utils__/types';
import { mount } from '@vue/test-utils';
import { describe, expect, test } from 'vitest';
import VInput from './v-input.vue';

const global: GlobalMountOptions = {
	stubs: ['v-icon'],
	directives: {
		focus: Focus,
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

	expect(wrapper.emitted()['update:modelValue'][0]).toEqual(['my value1']);
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

	expect(wrapper.emitted()['update:modelValue'][0]).toEqual(['please trim that beard']);
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

	expect(wrapper.emitted()['update:modelValue'][0]).toEqual(['this_hould_be_D_save']);
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

		const inputElement = wrapper.find('input').element;
		// mock keyboard event
		const keyboardEvent = new KeyboardEvent('keydown', event);
		// manually attach the input element as the mocked event's target
		Object.defineProperty(keyboardEvent, 'target', { value: inputElement });

		wrapper.vm.processValue(keyboardEvent);

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

		const inputElement = wrapper.find('input').element;
		// mock keyboard event
		const keyboardEvent = new KeyboardEvent('keydown', event);
		// manually attach the input element as the mocked event's target
		Object.defineProperty(keyboardEvent, 'target', { value: inputElement });

		wrapper.vm.processValue(keyboardEvent);

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

		expect(wrapper.emitted()['update:modelValue'][0]).toEqual([null]);
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

		expect(wrapper.emitted()['update:modelValue'][0]).toEqual([1]);
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

		expect(wrapper.emitted()['update:modelValue'][0]).toEqual(['test-']);
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

		expect(wrapper.emitted()['update:modelValue'][0]).toEqual(['a_custom_field']);
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

		expect(wrapper.emitted()['update:modelValue'][0]).toEqual(['test_field']);
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

		expect(wrapper.emitted()['update:modelValue'][0]).toEqual(['a_test_field']);
	});
});
