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
});
