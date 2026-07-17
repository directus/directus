import { Editor } from '@tiptap/vue-3';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { nextTick } from 'vue';
import { createI18n } from 'vue-i18n';
import { editorExtensions } from '../../extensions';
import TableBubbleMenu from './table-bubble-menu.vue';

const baseStubs = {
	VIcon: { template: '<i :data-icon="name" />', props: ['name'] },
	VButton: {
		template: '<button :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
		props: ['disabled'],
		emits: ['click'],
	},
};

const global = {
	plugins: [createI18n({ legacy: false })],
	directives: { tooltip: {} },
	stubs: {
		...baseStubs,
		BubbleMenu: { template: '<div><slot /></div>' },
	},
};

let editor: Editor;

beforeEach(() => {
	editor = new Editor({ extensions: editorExtensions, content: '<p>hello</p>' });
});

afterEach(() => editor.destroy());

interface Vm {
	shouldShow: () => boolean;
	getReferencedVirtualElement: () => { getBoundingClientRect: () => DOMRect } | null;
}

/** can() needs a mounted ProseMirror view (absent in jsdom); make every gate report enabled. */
function alwaysEnabled(): void {
	editor.can = () => new Proxy({}, { get: () => () => true }) as never;
}

function insertTable(): void {
	editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
}

describe('shouldShow', () => {
	function mountMenu() {
		// BubbleMenu: true keeps the slot (and its can()-bound buttons) from rendering.
		const wrapper = mount(TableBubbleMenu, { props: { editor }, global: { ...global, stubs: { BubbleMenu: true } } });
		return wrapper.vm as unknown as Vm;
	}

	test('false outside a table, true inside', () => {
		const vm = mountMenu();
		expect(vm.shouldShow()).toBe(false);

		insertTable();
		expect(editor.isActive('table')).toBe(true);
		expect(vm.shouldShow()).toBe(true);
	});

	test('false when the editor is not editable', () => {
		insertTable();
		const vm = mountMenu();
		expect(vm.shouldShow()).toBe(true);

		editor.setEditable(false);
		expect(vm.shouldShow()).toBe(false);
	});

	test('anchors to the table only while inside one', () => {
		const vm = mountMenu();
		expect(vm.getReferencedVirtualElement()).toBeNull();

		insertTable();
		expect(vm.getReferencedVirtualElement()).not.toBeNull();
	});
});

describe('root element', () => {
	/**
	 * Regression: the real BubbleMenu removes its own root element from the DOM on mount. If that
	 * element is also this component's root, Vue later resolves patch containers/anchors from the
	 * detached node and crashes mid-patch, leaving the editor half-rendered (e.g. on version switch).
	 */
	test('stays attached while BubbleMenu detaches its own element', async () => {
		const wrapper = mount(TableBubbleMenu, {
			props: { editor },
			global: { ...global, stubs: baseStubs }, // real BubbleMenu
			attachTo: document.body,
		});

		// BubbleMenu detaches its element in onMounted, then registers its plugin a tick later
		await nextTick();
		await nextTick();

		expect(wrapper.element.isConnected).toBe(true);

		wrapper.unmount();
	});
});

describe('actions', () => {
	function mountMenu() {
		alwaysEnabled();
		insertTable();
		return mount(TableBubbleMenu, { props: { editor }, global });
	}

	// DOM order matches tableActionGroups: [delete table] | [row before/after, delete row] | [col before/after, delete col]
	const DELETE_TABLE = 0;
	const ADD_ROW_AFTER = 2;
	const DELETE_ROW = 3;
	const ADD_COLUMN_AFTER = 5;
	const DELETE_COLUMN = 6;

	function rowCount(): number {
		return (editor.getHTML().match(/<tr/g) ?? []).length;
	}

	function colCount(): number {
		const firstRow = editor.getHTML().match(/<tr[^>]*>.*?<\/tr>/s)?.[0] ?? '';
		return (firstRow.match(/<t[hd]/g) ?? []).length;
	}

	test('renders one button per action', () => {
		const wrapper = mountMenu();
		expect(wrapper.findAll('button')).toHaveLength(7);
	});

	test('delete table button removes the table', async () => {
		const wrapper = mountMenu();
		await wrapper.findAll('button')[DELETE_TABLE]!.trigger('click');
		expect(editor.isActive('table')).toBe(false);
		expect(editor.getHTML()).not.toContain('<table');
	});

	test('add row / add column buttons grow the table', async () => {
		const wrapper = mountMenu();
		const rows = rowCount();
		const cols = colCount();

		await wrapper.findAll('button')[ADD_ROW_AFTER]!.trigger('click');
		expect(rowCount()).toBe(rows + 1);

		await wrapper.findAll('button')[ADD_COLUMN_AFTER]!.trigger('click');
		expect(colCount()).toBe(cols + 1);
	});

	test('delete row / delete column buttons shrink the table', async () => {
		const wrapper = mountMenu();
		const rows = rowCount();
		const cols = colCount();

		await wrapper.findAll('button')[DELETE_ROW]!.trigger('click');
		expect(rowCount()).toBe(rows - 1);

		await wrapper.findAll('button')[DELETE_COLUMN]!.trigger('click');
		expect(colCount()).toBe(cols - 1);
	});

	test('disables buttons whose command is unavailable', () => {
		insertTable();
		// deleteRow reports unavailable; everything else enabled.
		editor.can = () => new Proxy({}, { get: (_t, prop) => () => prop !== 'deleteRow' }) as never;

		const wrapper = mount(TableBubbleMenu, { props: { editor }, global });
		expect(wrapper.findAll('button')[DELETE_ROW]!.attributes('disabled')).toBeDefined();
		expect(wrapper.findAll('button')[DELETE_TABLE]!.attributes('disabled')).toBeUndefined();
	});
});
