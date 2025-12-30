import InputInterface from './input.vue';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const mountOptions = {
	global: {
		stubs: {
			'v-input': {
				name: 'v-input',
				props: ['modelValue', 'type', 'min', 'max', 'step', 'placeholder', 'disabled', 'trim', 'integer', 'float'],
				template: '<input />',
				emits: ['update:model-value'],
			},
			'v-icon': {
				template: '<span><slot /></span>',
			},
		},
	},
};

describe('input interface', () => {
	let wrapper: any;

	beforeEach(() => {
		vi.clearAllMocks();
	});

	test('interface mounts', () => {
		expect(() => {
			wrapper = mount(InputInterface, {
				...mountOptions,
				props: {
					value: 'test',
					type: 'string',
				},
			});
		}).not.toThrow();

		expect(wrapper.exists()).toBe(true);
	});

	describe('type handling', () => {
		test('sets inputType to "number" for integer type', () => {
			wrapper = mount(InputInterface, {
				...mountOptions,
				props: {
					value: 42,
					type: 'integer',
				},
			});

			const input = wrapper.findComponent({ name: 'v-input' });
			expect(input.props('type')).toBe('number');
		});

		test('sets inputType to "number" for float type', () => {
			wrapper = mount(InputInterface, {
				...mountOptions,
				props: {
					value: 3.14,
					type: 'float',
				},
			});

			const input = wrapper.findComponent({ name: 'v-input' });
			expect(input.props('type')).toBe('number');
		});

		test('sets inputType to "text" for string type', () => {
			wrapper = mount(InputInterface, {
				...mountOptions,
				props: {
					value: 'test',
					type: 'string',
				},
			});

			const input = wrapper.findComponent({ name: 'v-input' });
			expect(input.props('type')).toBe('text');
		});

		test('sets inputType to "password" when masked is true', () => {
			wrapper = mount(InputInterface, {
				...mountOptions,
				props: {
					value: 'secret',
					type: 'string',
					masked: true,
				},
			});

			const input = wrapper.findComponent({ name: 'v-input' });
			expect(input.props('type')).toBe('password');
		});
	});

	describe('integer and float props', () => {
		test('sets integer prop to true for integer type', () => {
			wrapper = mount(InputInterface, {
				...mountOptions,
				props: {
					value: 42,
					type: 'integer',
				},
			});

			const input = wrapper.findComponent({ name: 'v-input' });
			expect(input.props('integer')).toBe(true);
			expect(input.props('float')).toBe(false);
		});

		test('sets integer prop to true for bigInteger type', () => {
			wrapper = mount(InputInterface, {
				...mountOptions,
				props: {
					value: 42,
					type: 'bigInteger',
				},
			});

			const input = wrapper.findComponent({ name: 'v-input' });
			expect(input.props('integer')).toBe(true);
			expect(input.props('float')).toBe(false);
		});

		test('sets float prop to true for float type', () => {
			wrapper = mount(InputInterface, {
				...mountOptions,
				props: {
					value: 3.14,
					type: 'float',
				},
			});

			const input = wrapper.findComponent({ name: 'v-input' });
			expect(input.props('float')).toBe(true);
			expect(input.props('integer')).toBe(false);
		});

		test('sets float prop to true for decimal type', () => {
			wrapper = mount(InputInterface, {
				...mountOptions,
				props: {
					value: 19.99,
					type: 'decimal',
				},
			});

			const input = wrapper.findComponent({ name: 'v-input' });
			expect(input.props('float')).toBe(true);
			expect(input.props('integer')).toBe(false);
		});
	});

	describe('numeric options', () => {
		test('passes min and max props correctly', () => {
			wrapper = mount(InputInterface, {
				...mountOptions,
				props: {
					value: 5,
					type: 'integer',
					min: 0,
					max: 10,
				},
			});

			const input = wrapper.findComponent({ name: 'v-input' });
			expect(input.props('min')).toBe(0);
			expect(input.props('max')).toBe(10);
		});

		test('passes step prop correctly', () => {
			wrapper = mount(InputInterface, {
				...mountOptions,
				props: {
					value: 5,
					type: 'integer',
					step: 2,
				},
			});

			const input = wrapper.findComponent({ name: 'v-input' });
			expect(input.props('step')).toBe(2);
		});

		test('defaults step to 1', () => {
			wrapper = mount(InputInterface, {
				...mountOptions,
				props: {
					value: 5,
					type: 'integer',
				},
			});

			const input = wrapper.findComponent({ name: 'v-input' });
			expect(input.props('step')).toBe(1);
		});

		test('supports decimal step for float types', () => {
			wrapper = mount(InputInterface, {
				...mountOptions,
				props: {
					value: 5.5,
					type: 'float',
					step: 0.2,
				},
			});

			const input = wrapper.findComponent({ name: 'v-input' });
			expect(input.props('step')).toBe(0.2);
		});

		test('supports decimal min and max for float types', () => {
			wrapper = mount(InputInterface, {
				...mountOptions,
				props: {
					value: 5.5,
					type: 'float',
					min: 0.5,
					max: 10.5,
				},
			});

			const input = wrapper.findComponent({ name: 'v-input' });
			expect(input.props('min')).toBe(0.5);
			expect(input.props('max')).toBe(10.5);
		});
	});

	describe('events', () => {
		test('emits input event when value changes', async () => {
			wrapper = mount(InputInterface, {
				...mountOptions,
				props: {
					value: 'test',
					type: 'string',
				},
			});

			const input = wrapper.findComponent({ name: 'v-input' });
			await input.vm.$emit('update:model-value', 'new value');

			expect(wrapper.emitted('input')).toBeTruthy();
			expect(wrapper.emitted('input')?.[0]).toEqual(['new value']);
		});
	});

	describe('text field options', () => {
		test('renders with placeholder', () => {
			wrapper = mount(InputInterface, {
				...mountOptions,
				props: {
					value: '',
					type: 'string',
					placeholder: 'Enter text...',
				},
			});

			const input = wrapper.findComponent({ name: 'v-input' });
			expect(input.props('placeholder')).toBe('Enter text...');
		});

		test('passes trim prop for text trimming', () => {
			wrapper = mount(InputInterface, {
				...mountOptions,
				props: {
					value: 'test',
					type: 'string',
					trim: true,
				},
			});

			const input = wrapper.findComponent({ name: 'v-input' });
			expect(input.props('trim')).toBe(true);
		});
	});

	describe('state management', () => {
		test('handles disabled state', () => {
			wrapper = mount(InputInterface, {
				...mountOptions,
				props: {
					value: 'test',
					type: 'string',
					disabled: true,
				},
			});

			const input = wrapper.findComponent({ name: 'v-input' });
			expect(input.props('disabled')).toBe(true);
		});
	});
});
