import { Editor } from '@tiptap/vue-3';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { createI18n } from 'vue-i18n';
import { editorExtensions } from '../../extensions';
import { buildCustomFormats, type CustomFormat } from '../../extensions/custom-formats';
import StylesMenu from './styles-menu.vue';

const SAMPLE = [
	{ title: 'Highlight', inline: 'span', classes: 'hl', styles: { color: '#00ff00' } },
	{ title: 'Lead', inline: 'span', classes: 'lead' },
];

const global = {
	plugins: [createI18n({ legacy: false })],
	directives: { tooltip: {} },
	stubs: { VMenu: true, VButton: true, VIcon: true, VList: true, VListItem: true, VListItemContent: true },
};

let editor: Editor;
let formats: CustomFormat[];

beforeEach(() => {
	const built = buildCustomFormats(SAMPLE);
	formats = built.formats;
	editor = new Editor({ extensions: [...editorExtensions, ...built.extensions], content: '<p>hello</p>' });
	editor.commands.selectAll();
});

afterEach(() => editor.destroy());

function mountMenu() {
	return mount(StylesMenu, { props: { editor, label: 'wysiwyg_options.styles', formats }, global });
}

interface Vm {
	select: (name: string) => void;
	isFormatActive: (format: CustomFormat) => boolean;
}

describe('styles-menu', () => {
	test('applies the selected format mark to the selection', () => {
		const wrapper = mountMenu();
		(wrapper.vm as unknown as Vm).select(formats[0]!.name);
		expect(editor.isActive(formats[0]!.name)).toBe(true);
	});

	test('selecting an active format again removes it', () => {
		const wrapper = mountMenu();
		const vm = wrapper.vm as unknown as Vm;
		vm.select(formats[0]!.name);
		vm.select(formats[0]!.name);
		expect(editor.isActive(formats[0]!.name)).toBe(false);
	});

	test('reports active state per format', () => {
		const wrapper = mountMenu();
		const vm = wrapper.vm as unknown as Vm;
		vm.select(formats[0]!.name);
		expect(vm.isFormatActive(formats[0]!)).toBe(true);
		expect(vm.isFormatActive(formats[1]!)).toBe(false);
	});
});
