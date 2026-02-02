import { EditorView } from '@codemirror/view';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { createI18n } from 'vue-i18n';
import InputCode from './input-code.vue';

vi.mock('@/composables/use-window-size', () => ({
	useWindowSize: () => ({ width: { value: 1200 }, height: { value: 800 } }),
}));

vi.mock('./import-codemirror-mode', () => ({
	default: vi.fn(() => Promise.resolve([])),
}));

vi.mock('jsonlint-mod', () => ({
	default: {
		parser: {
			parseError: vi.fn(),
		},
		parse: vi.fn((text: string) => JSON.parse(text)),
	},
}));

const i18n = createI18n({
	legacy: false,
	missingWarn: false,
	locale: 'en-US',
	messages: {
		'en-US': {},
	},
});

function getEditorView(wrapper: ReturnType<typeof mount>): EditorView | null {
	const editorElement = wrapper.find('.input-code .cm-editor').element as HTMLElement;
	if (!editorElement) return null;
	return EditorView.findFromDOM(editorElement);
}

async function waitForEditor(wrapper: ReturnType<typeof mount>): Promise<EditorView | null> {
	await nextTick();
	await new Promise((resolve) => setTimeout(resolve, 10));
	return getEditorView(wrapper);
}

const globalMountOptions = {
	plugins: [i18n],
	stubs: {
		'v-button': {
			template: '<button class="v-button"><slot /></button>',
		},
		'v-icon': {
			template: '<span class="v-icon"><slot /></span>',
		},
	},
	directives: {
		tooltip: vi.fn(),
	},
};

describe('InputCode', () => {
	let wrapper: ReturnType<typeof mount>;

	afterEach(() => {
		wrapper?.unmount();
	});

	describe('Component Mounting', () => {
		it('should mount successfully', async () => {
			wrapper = mount(InputCode, {
				props: {
					value: 'console.log("test");',
				},
				global: globalMountOptions,
			});

			await waitForEditor(wrapper);

			expect(wrapper.exists()).toBe(true);
			expect(wrapper.find('.input-code').exists()).toBe(true);
		});

		it('should initialize editor with value prop', async () => {
			wrapper = mount(InputCode, {
				props: {
					value: 'const x = 42;',
				},
				global: globalMountOptions,
			});

			const editorView = await waitForEditor(wrapper);

			expect(editorView).toBeTruthy();
			expect(editorView?.state.doc.toString()).toBe('const x = 42;');
		});
	});

	describe('Disabled Prop', () => {
		it('should make editor readonly when disabled is true', async () => {
			wrapper = mount(InputCode, {
				props: {
					value: 'test code',
					disabled: true,
				},
				global: globalMountOptions,
			});

			const editorView = await waitForEditor(wrapper);

			expect(editorView).toBeTruthy();
			expect(editorView?.state.readOnly).toBe(true);
		});

		it('should update readonly state when disabled prop changes', async () => {
			wrapper = mount(InputCode, {
				props: {
					value: 'test code',
					disabled: false,
				},
				global: globalMountOptions,
			});

			let editorView = await waitForEditor(wrapper);
			expect(editorView?.state.readOnly).toBe(false);

			await wrapper.setProps({ disabled: true });
			await nextTick();

			editorView = getEditorView(wrapper);
			expect(editorView?.state.readOnly).toBe(true);
		});
	});

	describe('Placeholder Prop', () => {
		it('should apply placeholder when provided', async () => {
			wrapper = mount(InputCode, {
				props: {
					value: null,
					placeholder: 'Enter code here...',
				},
				global: globalMountOptions,
			});

			await waitForEditor(wrapper);

			const placeholderElement = wrapper.find('.cm-placeholder');
			expect(placeholderElement.exists()).toBe(true);
			expect(placeholderElement.text()).toBe('Enter code here...');
		});
	});

	describe('Line Number Prop', () => {
		it('should show line numbers by default', async () => {
			wrapper = mount(InputCode, {
				props: {
					value: 'line 1\nline 2\nline 3',
				},
				global: globalMountOptions,
			});

			await waitForEditor(wrapper);

			const gutters = wrapper.find('.cm-gutters');
			expect(gutters.exists()).toBe(true);
		});

		it('should hide line numbers when lineNumber is false', async () => {
			wrapper = mount(InputCode, {
				props: {
					value: 'test code',
					lineNumber: false,
				},
				global: globalMountOptions,
			});

			await waitForEditor(wrapper);

			const gutters = wrapper.find('.cm-gutters');
			expect(gutters.exists()).toBe(false);
		});
	});

	describe('Type Prop - JSON Handling', () => {
		it('should parse JSON value when type is json', async () => {
			wrapper = mount(InputCode, {
				props: {
					value: { key: 'value' },
					type: 'json',
				},
				global: globalMountOptions,
			});

			const editorView = await waitForEditor(wrapper);

			expect(editorView).toBeTruthy();
			const content = editorView?.state.doc.toString();
			expect(content).toContain('"key"');
			expect(content).toContain('"value"');
		});
	});

	describe('Value Updates', () => {
		it('should update editor when value prop changes', async () => {
			wrapper = mount(InputCode, {
				props: {
					value: 'Initial content',
				},
				global: globalMountOptions,
			});

			let editorView = await waitForEditor(wrapper);
			expect(editorView?.state.doc.toString()).toBe('Initial content');

			await wrapper.setProps({ value: 'Updated content' });
			await nextTick();

			editorView = getEditorView(wrapper);
			expect(editorView?.state.doc.toString()).toBe('Updated content');
		});
	});

	describe('Template Prop', () => {
		it('should show template button when template is provided', async () => {
			wrapper = mount(InputCode, {
				props: {
					value: '',
					template: '{"default": "template"}',
				},
				global: globalMountOptions,
			});

			await waitForEditor(wrapper);

			const button = wrapper.find('.v-button');
			expect(button.exists()).toBe(true);
		});

		it('should not show template button when template is not provided', async () => {
			wrapper = mount(InputCode, {
				props: {
					value: '',
				},
				global: globalMountOptions,
			});

			await waitForEditor(wrapper);

			const button = wrapper.find('.v-button');
			expect(button.exists()).toBe(false);
		});
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
			global: globalMountOptions,
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
			global: globalMountOptions,
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
