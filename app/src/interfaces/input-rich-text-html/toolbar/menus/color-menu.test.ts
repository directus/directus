import { Editor } from '@tiptap/vue-3';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { createI18n } from 'vue-i18n';
import { editorExtensions } from '../../extensions';
import ColorMenu from './color-menu.vue';
import { readStyle } from './text-style';

const global = {
	plugins: [createI18n({ legacy: false })],
	directives: { tooltip: {} },
	stubs: { VMenu: true, VButton: true, VIcon: true, SelectColor: true },
};

const menuStubs = {
	VMenu: {
		data: () => ({ open: false }),
		template: '<div><slot name="activator" :toggle="() => (open = !open)" :active="open" /><slot v-if="open" /></div>',
	},
	VButton: { emits: ['click'], template: '<button @click="$emit(\'click\', $event)"><slot /></button>' },
};

let editor: Editor;

beforeEach(() => {
	editor = new Editor({ extensions: editorExtensions, content: '<p>hello</p>' });
	editor.commands.selectAll();
});

afterEach(() => editor.destroy());

function mountMenu(mode: 'text' | 'background') {
	return mount(ColorMenu, {
		props: { editor, mode, icon: 'format_color_text', label: 'wysiwyg_options.forecolor' },
		global,
	});
}

describe('color-menu', () => {
	test('text mode applies foreground color', () => {
		const wrapper = mountMenu('text');
		(wrapper.vm as unknown as { apply: (v: string | null) => void }).apply('#ff0000');
		expect(readStyle(editor, 'color')).toBe('#ff0000');
	});

	test('background mode applies background color', () => {
		const wrapper = mountMenu('background');
		(wrapper.vm as unknown as { apply: (v: string | null) => void }).apply('#00ff00');
		expect(readStyle(editor, 'backgroundColor')).toBe('#00ff00');
	});

	test('apply(null) clears the color', () => {
		const wrapper = mountMenu('text');
		const vm = wrapper.vm as unknown as { apply: (v: string | null) => void };
		vm.apply('#ff0000');
		vm.apply(null);
		expect(readStyle(editor, 'color')).toBeNull();
	});

	// Inside the toolbar's "Show More" menu, a click that bubbles out closes that menu before this one opens.
	test('opens without letting the activator click reach a parent menu', async () => {
		const onParentClick = vi.fn();

		const Parent = defineComponent(
			() => () =>
				h('div', { onClick: onParentClick }, [
					h(ColorMenu, { editor, mode: 'text', icon: 'format_color_text', label: 'wysiwyg_options.forecolor' }),
				]),
		);

		const wrapper = mount(Parent, { global: { ...global, stubs: { ...global.stubs, ...menuStubs } } });

		await wrapper.find('button').trigger('click');

		expect(wrapper.find('.color-menu').exists()).toBe(true);
		expect(onParentClick).not.toHaveBeenCalled();
	});
});
