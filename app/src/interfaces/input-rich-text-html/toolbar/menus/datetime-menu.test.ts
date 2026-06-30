import { Editor } from '@tiptap/vue-3';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { createI18n } from 'vue-i18n';
import { editorExtensions } from '../../extensions';
import DateTimeMenu from './datetime-menu.vue';

const global = {
	plugins: [createI18n({ legacy: false })],
	directives: { tooltip: {} },
	stubs: { VMenu: true, VButton: true, VIcon: true, VList: true, VListItem: true, VListItemContent: true },
};

let editor: Editor;

beforeEach(() => {
	editor = new Editor({ extensions: editorExtensions, content: '<p>hello </p>' });
	editor.commands.focus('end');
});

afterEach(() => editor.destroy());

interface Format {
	labelKey: string;
	build: (date: Date) => string;
}

describe('datetime-menu', () => {
	test('insert drops the formatted value into the document', () => {
		const wrapper = mount(DateTimeMenu, { props: { editor }, global });
		const vm = wrapper.vm as unknown as { insert: (f: Format) => void; FORMATS: Format[] };

		vm.insert(vm.FORMATS[0]!);

		const year = String(new Date().getFullYear());
		expect(editor.getHTML()).toContain(year);
	});
});
