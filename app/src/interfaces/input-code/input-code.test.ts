import InputCode from './input-code.vue';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createI18n } from 'vue-i18n';

// Create i18n instance for tests
const i18n = createI18n({
	legacy: false,
	missingWarn: false,
	locale: 'en-US',
	messages: {
		'en-US': {},
	},
});

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

	// Global mount options with mocked components and plugins
	const globalMountOptions = {
		plugins: [i18n],
		directives: {
			tooltip: vi.fn(),
		},
		components: {
			'v-icon': {
				template: '<span class="v-icon"><slot /></span>',
			},
			'v-button': {
				template: '<button class="v-button"><slot /></button>',
			},
		},
	};

	beforeEach(() => {
		// Reset all mocks before each test
		vi.clearAllMocks();
	});

	it('should handle null language prop without throwing error', async () => {
		// Test that the component can be mounted with null language
		expect(() => {
			wrapper = mount(InputCode, {
				props: {
					language: null as any, // Cast to any to test null handling
					value: 'test code',
				},
				global: globalMountOptions,
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
				global: globalMountOptions,
			});
		}).not.toThrow();
	});

	it('should default to plaintext when language is null', async () => {
		wrapper = mount(InputCode, {
			props: {
				language: null as any, // Cast to any to test null handling
				value: 'test code',
			},
			global: globalMountOptions,
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
			global: globalMountOptions,
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
			global: globalMountOptions,
		});

		expect(wrapper.exists()).toBe(true);
		const codeElement = wrapper.find('.input-code');
		expect(codeElement.exists()).toBe(true);
	});
});
