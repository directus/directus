import { type Editor, EditorContent } from '@tiptap/vue-3';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { nextTick } from 'vue';
import { createI18n } from 'vue-i18n';
import Interface from './input-rich-text-html.vue';

/**
 * A linked image renders as `<a href><img></a>`, and ProseMirror stamps `contenteditable="false"`
 * on that outer `<a>` because the image is a leaf node. A non-editable anchor is a real link to the
 * browser, so a plain click would navigate away before the dblclick that opens the image drawer.
 */
const LINKED_IMAGE = '<a href="https://directus.io"><img src="/a.png" alt="a"></a><p>text</p>';

async function mountWithValue(value: string, props: Record<string, unknown> = {}) {
	const i18n = createI18n({ legacy: false, locale: 'en-US', messages: { 'en-US': {} } });

	const wrapper = mount(Interface, {
		props: { value, ...props },
		global: {
			plugins: [createPinia(), i18n],
			stubs: {
				Toolbar: true,
				TableBubbleMenu: true,
				ImageDrawer: true,
				LinkDrawer: true,
				MediaDrawer: true,
				SourceCodeDrawer: true,
				NormalizationWarningDialog: true,
				InterfaceInputCode: true,
			},
		},
	});

	await flushPromises();
	await nextTick();
	const editor = wrapper.findComponent(EditorContent).props('editor') as Editor;
	// the first mount in a file renders before onCreate has synced the value
	await vi.waitFor(() => expect(editor.view.dom.querySelector('a[href] img')).not.toBeNull());
	return { wrapper, editor };
}

function clickImage(editor: Editor, init: MouseEventInit = {}) {
	const img = editor.view.dom.querySelector('a[href] img')!;
	const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...init });
	img.dispatchEvent(event);
	return event;
}

afterEach(() => {
	vi.restoreAllMocks();
});

describe('clicking a linked image', () => {
	test('a plain click does not follow the link', async () => {
		const { editor } = await mountWithValue(LINKED_IMAGE);

		expect(editor.view.dom.querySelector('a[href]')?.getAttribute('contenteditable')).toBe('false');
		expect(clickImage(editor).defaultPrevented).toBe(true);
	});

	test('a Cmd/Ctrl+click opens the link in a new tab exactly once', async () => {
		const open = vi.spyOn(window, 'open').mockImplementation(() => null);
		const { editor } = await mountWithValue(LINKED_IMAGE);

		const event = clickImage(editor, { metaKey: true });

		expect(event.defaultPrevented).toBe(true);
		expect(open).toHaveBeenCalledTimes(1);
		expect(open).toHaveBeenCalledWith('https://directus.io/', '_blank', 'noopener,noreferrer');
	});

	test('a read-only editor leaves the link followable', async () => {
		const { editor } = await mountWithValue(LINKED_IMAGE, { disabled: true });

		expect(clickImage(editor).defaultPrevented).toBe(false);
	});
});
