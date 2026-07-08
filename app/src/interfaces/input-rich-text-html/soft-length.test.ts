import { type Editor, EditorContent } from '@tiptap/vue-3';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { describe, expect, test } from 'vitest';
import { nextTick } from 'vue';
import Interface from './input-rich-text-html.vue';

/**
 * CMS-2640: the `softLength` indicator, reimplemented on Tiptap's CharacterCount extension.
 * Threshold parity with the legacy TinyMCE editor — warn at ≤10% remaining, danger at ≤5%.
 */
async function mountWith(props: { value?: string | null; softLength?: number }) {
	const wrapper = mount(Interface, {
		props: { value: null, ...props },
		global: {
			plugins: [createPinia()],
			stubs: { Toolbar: true, TableBubbleMenu: true, ImageDrawer: true, LinkDrawer: true },
		},
	});

	await flushPromises();
	await nextTick();
	const editor = wrapper.findComponent(EditorContent).props('editor') as Editor;
	return { wrapper, editor };
}

/** Set the doc to `n` characters of text and let `onUpdate` refresh the count. */
async function typeChars(editor: Editor, n: number) {
	editor.commands.setContent(`<p>${'a'.repeat(n)}</p>`);
	await nextTick();
}

describe('soft length indicator', () => {
	test('does not render when softLength is unset', async () => {
		const { wrapper } = await mountWith({ value: '<p>hello</p>' });
		expect(wrapper.find('.remaining').exists()).toBe(false);
	});

	test('renders remaining characters when softLength is set', async () => {
		const { wrapper, editor } = await mountWith({ softLength: 100 });
		await typeChars(editor, 40);

		const remaining = wrapper.find('.remaining');
		expect(remaining.exists()).toBe(true);
		expect(remaining.text()).toBe('60');
		expect(remaining.classes()).not.toContain('warning');
		expect(remaining.classes()).not.toContain('danger');
	});

	test('applies the warning state at <10% remaining', async () => {
		const { wrapper, editor } = await mountWith({ softLength: 100 });
		await typeChars(editor, 91); // 9% remaining

		const remaining = wrapper.find('.remaining');
		expect(remaining.classes()).toContain('warning');
		expect(remaining.classes()).not.toContain('danger');
	});

	test('applies the danger state at <5% remaining', async () => {
		const { wrapper, editor } = await mountWith({ softLength: 100 });
		await typeChars(editor, 96); // 4% remaining

		const remaining = wrapper.find('.remaining');
		expect(remaining.classes()).toContain('warning');
		expect(remaining.classes()).toContain('danger');
	});

	test('does not block typing past the limit (soft)', async () => {
		const { wrapper, editor } = await mountWith({ softLength: 10 });
		await typeChars(editor, 25);

		expect(editor.storage.characterCount.characters()).toBe(25);
		expect(wrapper.find('.remaining').text()).toBe('-15');
	});
});
