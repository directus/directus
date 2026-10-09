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
	{ title: 'Dropcap', block: 'p', classes: 'dropcap' },
	{ title: 'Eyebrow', block: 'h2', classes: 'eyebrow' },
];

const global = {
	plugins: [createI18n({ legacy: false })],
	directives: { tooltip: {} },
	stubs: { VMenu: true, VButton: true, VIcon: true, VList: true, VListItem: true, VListItemContent: true },
};

// Renders slots so grouped entries can be asserted on in the DOM.
const renderingGlobal = {
	plugins: [createI18n({ legacy: false })],
	directives: { tooltip: {} },
	stubs: {
		VMenu: { template: '<div><slot name="activator" :active="false" :toggle="() => {}" /><slot /></div>' },
		VButton: { template: '<button><slot /></button>' },
		VIcon: { props: ['name'], template: '<i class="v-icon" :data-name="name" />' },
		VList: { template: '<div><slot /></div>' },
		VListItem: { template: '<div class="v-list-item"><slot /></div>' },
		VListItemContent: { template: '<div class="content"><slot /></div>' },
		VListItemIcon: { template: '<div class="icon"><slot /></div>' },
	},
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

function mountMenu(props: Partial<{ formats: CustomFormat[] }> = {}, mountGlobal: object = global) {
	return mount(StylesMenu, {
		props: { editor, label: 'wysiwyg_options.styles', formats, ...props },
		global: mountGlobal,
	});
}

interface Vm {
	select: (format: CustomFormat) => void;
	isFormatActive: (format: CustomFormat) => boolean;
	currentLabel: string;
}

function vmOf(wrapper: ReturnType<typeof mountMenu>): Vm {
	return wrapper.vm as unknown as Vm;
}

/** Narrow a built format by title so tests read by intent rather than index. */
function byTitle(title: string): CustomFormat {
	const format = formats.find((entry) => entry.title === title);
	if (!format) throw new Error(`no format titled ${title}`);
	return format;
}

describe('styles-menu: inline formats', () => {
	test('applies the selected format mark to the selection', () => {
		const vm = vmOf(mountMenu());
		const format = byTitle('Highlight');
		vm.select(format);

		expect(editor.isActive('name' in format ? format.name : '')).toBe(true);
	});

	test('selecting an active format again removes it', () => {
		const vm = vmOf(mountMenu());
		const format = byTitle('Highlight');
		vm.select(format);
		vm.select(format);

		expect(vm.isFormatActive(format)).toBe(false);
	});

	test('reports active state per format', () => {
		const vm = vmOf(mountMenu());
		vm.select(byTitle('Highlight'));

		expect(vm.isFormatActive(byTitle('Highlight'))).toBe(true);
		expect(vm.isFormatActive(byTitle('Lead'))).toBe(false);
	});

	test('the activator label follows the selection instead of caching the first read', () => {
		const vm = vmOf(mountMenu());
		expect(vm.currentLabel).toBe('wysiwyg_options.styles');

		vm.select(byTitle('Highlight'));
		expect(vm.currentLabel).toBe('Highlight');

		vm.select(byTitle('Highlight'));
		expect(vm.currentLabel).toBe('wysiwyg_options.styles');
	});
});

describe('styles-menu: block formats', () => {
	test('applies a block format to the block holding the selection', () => {
		const vm = vmOf(mountMenu());
		vm.select(byTitle('Dropcap'));

		expect(editor.getHTML()).toBe('<p class="dropcap">hello</p>');
	});

	test('selecting an active block format again removes it', () => {
		const vm = vmOf(mountMenu());
		vm.select(byTitle('Dropcap'));
		vm.select(byTitle('Dropcap'));

		expect(editor.getHTML()).toBe('<p>hello</p>');
	});

	test('reports active state from the block, not from a mark of the same name', () => {
		const vm = vmOf(mountMenu());

		expect(vm.isFormatActive(byTitle('Dropcap'))).toBe(false);
		vm.select(byTitle('Dropcap'));
		expect(vm.isFormatActive(byTitle('Dropcap'))).toBe(true);
	});

	test('a converting block format is applied through the menu', () => {
		const vm = vmOf(mountMenu());
		vm.select(byTitle('Eyebrow'));

		expect(editor.getHTML()).toContain('<h2 class="eyebrow">hello</h2>');
	});

	test('the activator shows the active block format title', () => {
		const vm = vmOf(mountMenu());
		expect(vm.currentLabel).toBe('wysiwyg_options.styles');

		vm.select(byTitle('Dropcap'));
		expect(vm.currentLabel).toBe('Dropcap');
	});
});

describe('styles-menu: groups', () => {
	const GROUPED = [
		{
			title: 'Paragraphs',
			items: [
				{ title: 'Dropcap', block: 'p', classes: 'dropcap' },
				{ title: 'Latex', block: 'p', classes: 'latex' },
			],
		},
	];

	test('renders a group as a submenu holding its children', () => {
		const grouped = buildCustomFormats(GROUPED).formats;
		const wrapper = mountMenu({ formats: grouped }, renderingGlobal);

		expect(wrapper.text()).toContain('Paragraphs');
		expect(wrapper.text()).toContain('Dropcap');
		expect(wrapper.text()).toContain('Latex');
		expect(wrapper.findAll('.v-icon').map((icon) => icon.attributes('data-name'))).toContain('chevron_right');
	});

	test('an active group child drives the activator label', () => {
		const grouped = buildCustomFormats(GROUPED).formats;
		const group = grouped[0]!;
		if (group.kind !== 'group') throw new Error('expected a group');

		const vm = vmOf(mountMenu({ formats: grouped }));
		vm.select(group.items[1]!);

		expect(vm.currentLabel).toBe('Latex');
	});
});
