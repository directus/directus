import type { RichTextBubbleMenu } from '@directus/extensions';
import { Editor } from '@tiptap/vue-3';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { nextTick } from 'vue';
import { editorExtensions } from '../../extensions';
import ContributedBubbleMenu from './contributed-bubble-menu.vue';

const global = {
	directives: { tooltip: {} },
	stubs: {
		VIcon: { template: '<i :data-icon="name" />', props: ['name'] },
		VButton: {
			template: '<button :disabled="disabled" :data-active="active" @click="$emit(\'click\')"><slot /></button>',
			props: ['disabled', 'active'],
			emits: ['click'],
		},
		BubbleMenu: { template: '<div><slot /></div>' },
	},
};

let editor: Editor;

beforeEach(() => {
	editor = new Editor({ extensions: editorExtensions, content: '<p>hello</p>' });
});

afterEach(() => editor.destroy());

const button = (key: string, overrides: object = {}) => ({
	key,
	icon: 'info',
	label: key,
	command: () => {},
	...overrides,
});

const menu = (key: string, shouldShow: () => boolean, buttons = [button(`${key}-button`)]): RichTextBubbleMenu => ({
	key,
	shouldShow,
	buttons,
});

function mountMenu(menus: RichTextBubbleMenu[]) {
	const wrapper = mount(ContributedBubbleMenu, { props: { editor, menus }, global });
	const vm = wrapper.vm as unknown as { shouldShow: () => boolean };
	return { wrapper, vm };
}

const icons = (wrapper: ReturnType<typeof mountMenu>['wrapper']) =>
	wrapper.findAll('button').map((b) => b.find('i').attributes('data-icon'));

describe('shouldShow', () => {
	test('is false when no menu matches', () => {
		const { vm } = mountMenu([menu('a', () => false)]);
		expect(vm.shouldShow()).toBe(false);
	});

	test('is true when a menu matches', () => {
		const { vm } = mountMenu([menu('a', () => true)]);
		expect(vm.shouldShow()).toBe(true);
	});

	test('passes the editor to the menu', () => {
		const shouldShow = vi.fn(() => true);
		const { vm } = mountMenu([menu('a', shouldShow)]);

		vm.shouldShow();
		expect(shouldShow).toHaveBeenCalledWith(editor);
	});

	test('is false while the editor is not editable', () => {
		const { vm } = mountMenu([menu('a', () => true)]);
		editor.setEditable(false);
		expect(vm.shouldShow()).toBe(false);
	});

	// the table menu owns the selection there, and two menus would overlap at the top of the table
	test('is false while the cursor is in a table', () => {
		const { vm } = mountMenu([menu('a', () => true)]);
		editor.chain().focus().insertTable({ rows: 2, cols: 2 }).run();
		expect(vm.shouldShow()).toBe(false);
	});

	test('counts a menu that throws as no match and checks the next one', () => {
		const error = vi.spyOn(console, 'error').mockImplementation(() => {});

		const broken = menu('ext:broken', () => {
			throw new Error('boom');
		});

		const { vm } = mountMenu([broken, menu('ext:ok', () => true)]);

		expect(vm.shouldShow()).toBe(true);
		vm.shouldShow();
		expect(error).toHaveBeenCalledOnce();
		expect(error.mock.calls[0]!.join(' ')).toContain('"ext:broken"');
		error.mockRestore();
	});
});

describe('content', () => {
	test('renders the buttons of the first menu that matches', async () => {
		const { wrapper, vm } = mountMenu([
			menu('a', () => false, [button('a', { icon: 'star' })]),
			menu('b', () => true, [button('b', { icon: 'info' })]),
			menu('c', () => true, [button('c', { icon: 'bolt' })]),
		]);

		vm.shouldShow();
		await nextTick();
		expect(icons(wrapper)).toEqual(['info']);
	});

	test('runs the command of a clicked button with the editor', async () => {
		const command = vi.fn();
		const { wrapper, vm } = mountMenu([menu('a', () => true, [button('a', { command })])]);

		vm.shouldShow();
		await nextTick();
		await wrapper.find('button').trigger('click');
		expect(command).toHaveBeenCalledWith(editor);
	});

	test('reflects isActive and isDisabled', async () => {
		const { wrapper, vm } = mountMenu([
			menu('a', () => true, [button('a', { isActive: () => true, isDisabled: () => true })]),
		]);

		vm.shouldShow();
		await nextTick();
		const rendered = wrapper.find('button');
		expect(rendered.attributes('data-active')).toBe('true');
		expect(rendered.attributes('disabled')).toBeDefined();
	});
});
