import { Editor } from '@tiptap/vue-3';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { createI18n } from 'vue-i18n';
import { editorExtensions } from '../../extensions';
import StyleListMenu from './style-list-menu.vue';
import { readStyle } from './text-style';

const global = {
	plugins: [createI18n({ legacy: false })],
	directives: { tooltip: {} },
	stubs: { VMenu: true, VButton: true, VIcon: true, VList: true, VListItem: true, VListItemContent: true },
};

let editor: Editor;

beforeEach(() => {
	editor = new Editor({ extensions: editorExtensions, content: '<p>hello</p>' });
	editor.commands.selectAll();
});

afterEach(() => editor.destroy());

function mountMenu() {
	return mount(StyleListMenu, {
		props: {
			editor,
			icon: 'format_size',
			label: 'wysiwyg_options.fontsizeselect',
			attr: 'fontSize' as const,
			items: [
				{ label: 'Default', value: null },
				{ label: '16', value: '16px' },
				{ label: '24', value: '24px' },
			],
		},
		global,
	});
}

describe('style-list-menu', () => {
	test('applies the selected value to the editor', () => {
		const wrapper = mountMenu();
		(wrapper.vm as unknown as { select: (v: string | null) => void }).select('24px');
		expect(readStyle(editor, 'fontSize')).toBe('24px');
	});

	test('select(null) unsets the value', () => {
		const wrapper = mountMenu();
		const vm = wrapper.vm as unknown as { select: (v: string | null) => void };
		vm.select('24px');
		vm.select(null);
		expect(readStyle(editor, 'fontSize')).toBeNull();
	});

	// A real browser rewrites the single quotes in our item values to double when it serializes the inline
	// style, so the value read back differs from the item by quote style only. The activator label must still
	// match the named font instead of falling back to the raw quoted value (the `"Arial Blac…` bug).
	test('matches a font-family whose quotes differ from the item value', () => {
		const wrapper = mount(StyleListMenu, {
			props: {
				editor,
				icon: 'format_size',
				label: 'wysiwyg_options.fontselect',
				attr: 'fontFamily' as const,
				items: [
					{ label: 'Default', value: null },
					{ label: 'Arial Black', value: "'Arial Black', sans-serif" },
				],
			},
			global,
		});

		const vm = wrapper.vm as unknown as { select: (v: string | null) => void; currentLabel: string };

		// Simulate the browser-serialized value (double quotes), which the item declares with single quotes.
		vm.select('"Arial Black", sans-serif');
		expect(readStyle(editor, 'fontFamily')).toBe('"Arial Black", sans-serif');

		// The label resolves to the named font, not the raw quoted value.
		expect(vm.currentLabel).toBe('Arial Black');
	});
});
