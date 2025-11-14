import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { EditorView } from '@codemirror/view';
import { createI18n } from 'vue-i18n';
import InputRichTextMD from './input-rich-text-md.vue';

vi.mock('@/composables/use-window-size', () => ({
	useWindowSize: () => ({ width: { value: 1200 }, height: { value: 800 } }),
}));

vi.mock('@/composables/use-shortcut', () => ({
	useShortcut: vi.fn(),
}));

vi.mock('@/utils/get-asset-url', () => ({
	getAssetUrl: vi.fn((id: string) => `/assets/${id}`),
}));

vi.mock('@/utils/percentage', () => ({
	percentage: vi.fn((count: number, max: number) => (count / max) * 100),
}));

vi.mock('@/utils/translate-shortcut', () => ({
	translateShortcut: vi.fn(() => 'Meta'),
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
	const editorElement = wrapper.find('.codemirror-container .cm-editor').element as HTMLElement;
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
		'v-menu': {
			template: '<div class="v-menu"><slot /></div>',
		},
		'v-list': {
			template: '<div class="v-list"><slot /></div>',
		},
		'v-list-item': {
			template: '<div class="v-list-item"><slot /></div>',
		},
		'v-list-item-content': {
			template: '<div class="v-list-item-content"><slot /></div>',
		},
		'v-list-item-hint': {
			template: '<div class="v-list-item-hint"><slot /></div>',
		},
		'v-text-overflow': {
			template: '<span class="v-text-overflow"><slot /></span>',
		},
		'v-item-group': {
			template: '<div class="v-item-group"><slot /></div>',
		},
		'v-dialog': {
			template: '<div class="v-dialog"><slot /></div>',
		},
		'v-card': {
			template: '<div class="v-card"><slot /></div>',
		},
		'v-card-title': {
			template: '<div class="v-card-title"><slot /></div>',
		},
		'v-card-text': {
			template: '<div class="v-card-text"><slot /></div>',
		},
		'v-card-actions': {
			template: '<div class="v-card-actions"><slot /></div>',
		},
		'v-upload': {
			template: '<div class="v-upload"></div>',
		},
		'v-input': {
			template: '<input class="v-input" />',
		},
	},
	directives: {
		tooltip: vi.fn(),
		md: vi.fn(),
	},
};

describe('InputRichTextMD', () => {
	let wrapper: ReturnType<typeof mount>;

	afterEach(() => {
		wrapper?.unmount();
	});

	describe('Component Mounting', () => {
		it('should mount successfully', async () => {
			wrapper = mount(InputRichTextMD, {
				props: {
					value: 'Test content',
				},
				global: globalMountOptions,
			});

			await waitForEditor(wrapper);

			expect(wrapper.exists()).toBe(true);
			expect(wrapper.find('.interface-input-rich-text-md').exists()).toBe(true);
		});

		it('should initialize editor with value prop', async () => {
			wrapper = mount(InputRichTextMD, {
				props: {
					value: '# Hello World',
				},
				global: globalMountOptions,
			});

			const editorView = await waitForEditor(wrapper);

			expect(editorView).toBeTruthy();
			expect(editorView?.state.doc.toString()).toBe('# Hello World');
		});
	});

	describe('Disabled Prop', () => {
		it('should make editor readonly when disabled is true', async () => {
			wrapper = mount(InputRichTextMD, {
				props: {
					value: 'Test content',
					disabled: true,
				},
				global: globalMountOptions,
			});

			const editorView = await waitForEditor(wrapper);

			expect(editorView).toBeTruthy();
			expect(editorView?.state.readOnly).toBe(true);
		});

		it('should update readonly state when disabled prop changes', async () => {
			wrapper = mount(InputRichTextMD, {
				props: {
					value: 'Test content',
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
			wrapper = mount(InputRichTextMD, {
				props: {
					value: null,
					placeholder: 'Enter markdown here...',
				},
				global: globalMountOptions,
			});

			await waitForEditor(wrapper);

			const placeholderElement = wrapper.find('.cm-placeholder');
			expect(placeholderElement.exists()).toBe(true);
		});
	});

	describe('Default View Prop', () => {
		it('should use preview view when defaultView is preview', async () => {
			wrapper = mount(InputRichTextMD, {
				props: {
					value: 'Test',
					defaultView: 'preview',
				},
				global: globalMountOptions,
			});

			await waitForEditor(wrapper);

			expect(wrapper.find('.interface-input-rich-text-md').classes()).toContain('preview');
		});
	});

	describe('Direction Prop', () => {
		it('should apply ltr direction by default', async () => {
			wrapper = mount(InputRichTextMD, {
				props: {
					value: 'Test',
				},
				global: globalMountOptions,
			});

			const editorView = await waitForEditor(wrapper);

			expect(editorView).toBeTruthy();
			const contentElement = wrapper.find('.cm-content').element;
			expect(contentElement?.getAttribute('dir')).toBe('ltr');
		});

		it('should apply rtl direction when prop is rtl', async () => {
			wrapper = mount(InputRichTextMD, {
				props: {
					value: 'Test',
					direction: 'rtl',
				},
				global: globalMountOptions,
			});

			const editorView = await waitForEditor(wrapper);

			expect(editorView).toBeTruthy();
			const contentElement = wrapper.find('.cm-content').element;
			expect(contentElement?.getAttribute('dir')).toBe('rtl');
		});
	});

	describe('Value Updates', () => {
		it('should update editor when value prop changes', async () => {
			wrapper = mount(InputRichTextMD, {
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

	describe('Input Event Emission', () => {
		it('should emit input event when user types in editor', async () => {
			wrapper = mount(InputRichTextMD, {
				props: {
					value: '',
				},
				global: globalMountOptions,
			});

			const editorView = await waitForEditor(wrapper);
			expect(editorView).toBeTruthy();

			editorView?.dispatch({
				changes: {
					from: 0,
					to: 0,
					insert: 'New content',
				},
			});

			await nextTick();

			expect(wrapper.emitted('input')).toBeTruthy();
			expect(wrapper.emitted('input')?.[0]).toEqual(['New content']);
		});
	});
});
