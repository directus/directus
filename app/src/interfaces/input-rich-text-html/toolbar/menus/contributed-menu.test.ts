import type { RichTextMenuButton } from '@directus/extensions';
import StarterKit from '@tiptap/starter-kit';
import { Editor } from '@tiptap/vue-3';
import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createI18n } from 'vue-i18n';
import { createMemoryHistory, createRouter } from 'vue-router';
import ContributedMenu from './contributed-menu.vue';

let editor: Editor;

beforeEach(() => {
	editor = new Editor({ extensions: [StarterKit], content: '<p>x</p>' });
});

afterEach(() => editor.destroy());

// renders the activator and the list together, so the items are in the DOM without opening a teleport
const VMenu = {
	props: ['modelValue'],
	emits: ['update:modelValue'],
	template: '<div><slot name="activator" :toggle="() => {}" :active="modelValue" /><slot /></div>',
};

function mountMenu(button: RichTextMenuButton, props: { disabled?: boolean } = {}) {
	const router = createRouter({
		history: createMemoryHistory(),
		routes: [{ path: '/', component: { template: '<div />' } }],
	});

	return mount(ContributedMenu, {
		props: { editor, button, ...props },
		global: {
			plugins: [createPinia(), createI18n({ legacy: false }), router],
			stubs: { VMenu },
		},
	});
}

const tone = (overrides: Partial<RichTextMenuButton> = {}): RichTextMenuButton => ({
	key: 'tone',
	icon: 'palette',
	label: 'Tone',
	items: [
		{ key: 'info', label: 'Info', icon: 'info', command: () => {} },
		{ key: 'warning', label: 'Warning', command: () => {} },
	],
	...overrides,
});

const trigger = (wrapper: ReturnType<typeof mountMenu>) => wrapper.find('.toolbar-popover button');
const items = (wrapper: ReturnType<typeof mountMenu>) => wrapper.findAll('.v-list-item');

describe('contributed-menu', () => {
	test('shows the button icon and a caret on the trigger', () => {
		const icons = mountMenu(tone())
			.findAll('.toolbar-popover .v-icon i')
			.map((icon) => icon.attributes('data-icon'));

		expect(icons).toEqual(['palette', 'expand_more']);
	});

	test('lists one row per item with its label and icon', () => {
		const wrapper = mountMenu(tone());

		expect(items(wrapper).map((item) => item.text())).toEqual(['Info', 'Warning']);
		expect(items(wrapper)[0]!.find('.v-icon i').attributes('data-icon')).toBe('info');
		expect(items(wrapper)[1]!.find('.v-icon').exists()).toBe(false);
	});

	test('runs the item command with the editor on click', async () => {
		const command = vi.fn();
		const wrapper = mountMenu(tone({ items: [{ key: 'info', label: 'Info', command }] }));

		await items(wrapper)[0]!.trigger('click');
		expect(command).toHaveBeenCalledWith(editor);
	});

	test('does not run a disabled item', async () => {
		const command = vi.fn();
		const wrapper = mountMenu(tone({ items: [{ key: 'info', label: 'Info', command, isDisabled: () => true }] }));

		expect(items(wrapper)[0]!.classes()).toContain('disabled');
		await items(wrapper)[0]!.trigger('click');
		expect(command).not.toHaveBeenCalled();
	});

	test('marks the active item', () => {
		const wrapper = mountMenu(
			tone({
				items: [
					{ key: 'info', label: 'Info', command: () => {}, isActive: () => false },
					{ key: 'warning', label: 'Warning', command: () => {}, isActive: () => true },
				],
			}),
		);

		expect(items(wrapper).map((item) => item.classes().includes('active'))).toEqual([false, true]);
	});

	test('makes the trigger active when one item is active', () => {
		const wrapper = mountMenu(
			tone({ items: [{ key: 'info', label: 'Info', command: () => {}, isActive: () => true }] }),
		);

		expect(trigger(wrapper).classes()).toContain('active');
	});

	test('lets the button isActive win over its items', () => {
		const wrapper = mountMenu(
			tone({ isActive: () => false, items: [{ key: 'info', label: 'Info', command: () => {}, isActive: () => true }] }),
		);

		expect(trigger(wrapper).classes()).not.toContain('active');
	});

	test('disables the trigger when the toolbar is disabled', () => {
		expect(trigger(mountMenu(tone(), { disabled: true })).attributes('disabled')).toBeDefined();
	});

	test('disables the trigger when the button isDisabled returns true', () => {
		expect(trigger(mountMenu(tone({ isDisabled: () => true }))).attributes('disabled')).toBeDefined();
	});

	test('keeps the trigger disabled in a disabled toolbar when isDisabled returns false', () => {
		const wrapper = mountMenu(tone({ isDisabled: () => false }), { disabled: true });
		expect(trigger(wrapper).attributes('disabled')).toBeDefined();
	});
});
