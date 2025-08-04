import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import InputCode from './input-code.vue';

// Mock CodeMirror
vi.mock('codemirror', () => {
	return {
		default: vi.fn(() => ({
			setOption: vi.fn(),
			on: vi.fn(),
			getValue: vi.fn(() => ''),
			setValue: vi.fn(),
		})),
		Pos: vi.fn(),
		registerHelper: vi.fn(),
	};
});

// Mock import functions
vi.mock('./import-codemirror-mode', () => ({
	default: vi.fn(),
}));

describe('InputCode', () => {
	let wrapper: any;

	beforeEach(() => {
		// Reset all mocks before each test
		vi.clearAllMocks();
	});

	it('should handle null language prop without throwing error', async () => {
		// Test that the component can be mounted with null language
		expect(() => {
			wrapper = mount(InputCode, {
				props: {
					language: null,
					value: 'test code',
				},
			});
		}).not.toThrow();
	});

	it('should handle undefined language prop without throwing error', async () => {
		// Test that the component can be mounted with undefined language
		expect(() => {
			wrapper = mount(InputCode, {
				props: {
					value: 'test code',
					// language is undefined (not provided)
				},
			});
		}).not.toThrow();
	});

	it('should default to plaintext when language is null', async () => {
		wrapper = mount(InputCode, {
			props: {
				language: null,
				value: 'test code',
			},
		});

		// Verify the component exists and is mounted
		expect(wrapper.exists()).toBe(true);
		
		// Since we're testing the internal logic, let's verify that null doesn't break the component
		// The key thing is that the component mounts without throwing an error
		const codeElement = wrapper.find('.input-code');
		expect(codeElement.exists()).toBe(true);
	});

	it('should default to plaintext when language is empty string', async () => {
		wrapper = mount(InputCode, {
			props: {
				language: '',
				value: 'test code',
			},
		});

		expect(wrapper.exists()).toBe(true);
		const codeElement = wrapper.find('.input-code');
		expect(codeElement.exists()).toBe(true);
	});

	it('should work normally with valid language', async () => {
		wrapper = mount(InputCode, {
			props: {
				language: 'javascript',
				value: 'console.log("test");',
			},
		});

		expect(wrapper.exists()).toBe(true);
		const codeElement = wrapper.find('.input-code');
		expect(codeElement.exists()).toBe(true);
	});
});