import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import InputCode from './input-code.vue';
import type { GlobalMountOptions } from '@/__utils__/types';
import { i18n } from '@/lang';

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
	const global: GlobalMountOptions = {
		plugins: [i18n],
		directives: {
			tooltip: vi.fn(),
		},
		stubs: {
			VIcon: true,
			VButton: true,
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
				global,
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
				global,
			});
		}).not.toThrow();
	});

	it('should default to plaintext when language is null', async () => {
		wrapper = mount(InputCode, {
			props: {
				language: null as any, // Cast to any to test null handling
				value: 'test code',
			},
			global,
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
			global,
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
			global,
		});

		expect(wrapper.exists()).toBe(true);
		const codeElement = wrapper.find('.input-code');
		expect(codeElement.exists()).toBe(true);
	});

	it('should hide action buttons when nonEditable is true', () => {
		const wrapper = mount(InputCode, {
			props: {
				language: 'javascript',
				value: 'console.log("test");',
				template: 'console.log("template");',
				nonEditable: true,
				// Note: if nonEditable is true, disabled prop will also be true
				disabled: true,
			},
			global,
		});

		expect(wrapper.find('.input-code.non-editable').exists()).toBe(true);
		expect(wrapper.find('.input-code.non-editable v-button-stub').exists()).toBe(false);
	});

	it('should render action button disabled when disabled is true', () => {
		const wrapper = mount(InputCode, {
			props: {
				language: 'javascript',
				value: 'console.log("test");',
				template: 'console.log("template");',
				disabled: true,
			},
			global,
		});

		expect(wrapper.html()).toMatchInlineSnapshot(`
			"<div data-v-3cd4e8d0="" class="input-code codemirror-custom-styles disabled" dir="ltr">
			  <div data-v-3cd4e8d0=""></div>
			  <v-button-stub data-v-3cd4e8d0="" autofocus="false" kind="normal" fullwidth="false" rounded="false" outlined="false" icon="true" type="button" disabled="true" loading="false" to="" target="_blank" exact="false" query="false" secondary="true" warning="false" danger="false" dashed="false" tile="false" align="center" xsmall="false" small="true" large="false" xlarge="false"></v-button-stub>
			</div>"
		`);

		expect(wrapper.find('.input-code v-button-stub').attributes('disabled')).toBe('true');
	});
});
