import { Editor, EditorContent } from '@tiptap/vue-3';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { describe, expect, test } from 'vitest';
import { nextTick } from 'vue';
import { createI18n } from 'vue-i18n';
import { editorExtensions } from './extensions';
import { ComparisonDiff } from './extensions/comparison-diff';
import Interface from './input-rich-text-html.vue';

/**
 * Comparison mode: the comparison view feeds the editor diff-marked HTML
 * (`use-comparison-diff.ts` wraps changed text runs in `span.comparison-diff--added|--removed`).
 * The ComparisonDiff mark lets those spans survive schema parsing; it is registered only in
 * comparison mode, so the normal editing schema strips them (guard test below).
 */
function roundTrip(html: string, extensions: any[] = [...editorExtensions, ComparisonDiff]): string {
	const editor = new Editor({ extensions, content: html });
	const out = editor.getHTML();
	editor.destroy();
	return out;
}

describe('with ComparisonDiff registered', () => {
	const CASES: Record<string, string> = {
		'added span': '<p>Hello <span class="comparison-diff--added">world</span></p>',
		'removed span': '<p>Hello <span class="comparison-diff--removed">old world</span></p>',
		'both in one paragraph':
			'<p><span class="comparison-diff--removed">old</span> <span class="comparison-diff--added">new</span></p>',
		'span in heading': '<h2>Title <span class="comparison-diff--removed">old</span></h2>',
		'span in list item': '<ul><li><p><span class="comparison-diff--added">item</span></p></li></ul>',
		'span nested in bold': '<p><strong>bold <span class="comparison-diff--added">new</span></strong></p>',
		'span inside link': '<p><a href="https://directus.io"><span class="comparison-diff--added">link</span></a></p>',
	};

	for (const [name, html] of Object.entries(CASES)) {
		test(`${name} survives round-trip`, () => {
			expect(roundTrip(html)).toBe(html);
		});
	}
});

describe('without ComparisonDiff (normal editing schema)', () => {
	test('diff spans are stripped', () => {
		const html = '<p>Hello <span class="comparison-diff--added">world</span></p>';
		expect(roundTrip(html, [...editorExtensions])).toBe('<p>Hello world</p>');
	});
});

describe('interface wiring', () => {
	const DIFF_HTML = '<p>Hello <span class="comparison-diff--added">world</span></p>';

	async function mountInterface(props: Record<string, unknown>) {
		const i18n = createI18n({ legacy: false, locale: 'en-US', messages: { 'en-US': {} } });

		const wrapper = mount(Interface, {
			props: { value: DIFF_HTML, ...props },
			global: {
				plugins: [createPinia(), i18n],
				stubs: { Toolbar: true, TableBubbleMenu: true, ImageDrawer: true, LinkDrawer: true },
			},
		});

		await flushPromises();
		// tiptap defers `create` (which runs the interface's initial content sync) behind
		// setTimeout(0); await a later-queued macrotask so the sync has run before assertions
		await new Promise((resolve) => setTimeout(resolve, 0));
		await nextTick();
		const editor = wrapper.findComponent(EditorContent).props('editor') as Editor;
		return { wrapper, editor };
	}

	test('comparisonMode renders read-only without editing chrome, diff spans intact', async () => {
		const { wrapper, editor } = await mountInterface({
			comparisonMode: true,
			softLength: 100,
		});

		expect(editor.isEditable).toBe(false);
		expect(wrapper.find('toolbar-stub').exists()).toBe(false);
		expect(wrapper.find('table-bubble-menu-stub').exists()).toBe(false);
		// the diff-marked value inflates the count, so the counter must not render either
		expect(wrapper.find('.remaining').exists()).toBe(false);
		expect(wrapper.classes()).toContain('non-editable');
		expect(editor.getHTML()).toBe(DIFF_HTML);
	});

	test('normal mode keeps chrome and strips diff spans', async () => {
		const { wrapper, editor } = await mountInterface({});

		// the stripped spans register as normalization loss, so the guard mounts the editor read-only
		expect(editor.isEditable).toBe(false);
		expect(wrapper.find('toolbar-stub').exists()).toBe(true);
		expect(editor.getHTML()).toBe('<p>Hello world</p>');
	});
});
