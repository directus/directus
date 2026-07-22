import { type Editor, EditorContent } from '@tiptap/vue-3';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { describe, expect, test } from 'vitest';
import { nextTick } from 'vue';
import { createI18n } from 'vue-i18n';
import NormalizationWarningDialog from './drawers/normalization-warning-dialog.vue';
import Interface from './input-rich-text-html.vue';

/**
 * Integration wiring for the normalization guard: a stored value the schema can't represent keeps
 * the editor read-only (so no edit can reach autosave) until the warning dialog is confirmed
 * (see use-normalization-warning.test.ts for the state machine itself).
 */
async function mountWithValue(value: string | null, extraProps: Record<string, unknown> = {}) {
	const i18n = createI18n({ legacy: false, locale: 'en-US', messages: { 'en-US': {} } });

	const wrapper = mount(Interface, {
		props: { value, ...extraProps },
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
			},
		},
	});

	await flushPromises();
	await nextTick();
	const editor = wrapper.findComponent(EditorContent).props('editor') as Editor;
	return { wrapper, editor };
}

function findDialog(wrapper: Awaited<ReturnType<typeof mountWithValue>>['wrapper']) {
	return wrapper.findComponent(NormalizationWarningDialog);
}

describe('normalization warning wiring', () => {
	test('a lossy stored value mounts the editor read-only', async () => {
		const { editor } = await mountWithValue('<marquee>legacy</marquee>');

		expect(editor.isEditable).toBe(false);
	});

	test('a clean stored value mounts the editor editable and clicking opens nothing', async () => {
		const { wrapper, editor } = await mountWithValue('<p>hello <strong>world</strong></p>');

		expect(editor.isEditable).toBe(true);

		await wrapper.findComponent(EditorContent).trigger('click');

		expect(findDialog(wrapper).props('modelValue')).toBe(false);
	});

	test('clicking a locked editor opens the warning dialog', async () => {
		const { wrapper } = await mountWithValue('<marquee>legacy</marquee>');

		await wrapper.findComponent(EditorContent).trigger('click');

		expect(findDialog(wrapper).props('modelValue')).toBe(true);
	});

	test('confirming the warning unlocks the editor', async () => {
		const { wrapper, editor } = await mountWithValue('<marquee>legacy</marquee>');

		await wrapper.findComponent(EditorContent).trigger('click');
		findDialog(wrapper).vm.$emit('confirm');
		await flushPromises();
		await nextTick();

		expect(editor.isEditable).toBe(true);
	});

	// setEditable(false) only blocks typing — commands still run programmatically, so the toolbar
	// (bold, source-code drawer, …) must be disabled too or it can mutate the doc around the lock
	test('the lock disables the toolbar and hides the table bubble menu until confirmed', async () => {
		const { wrapper } = await mountWithValue('<marquee>legacy</marquee>');

		expect(wrapper.find('toolbar-stub').attributes('disabled')).toBe('true');
		expect(wrapper.find('table-bubble-menu-stub').exists()).toBe(false);

		await wrapper.findComponent(EditorContent).trigger('click');
		findDialog(wrapper).vm.$emit('confirm');
		await flushPromises();
		await nextTick();

		expect(wrapper.find('toolbar-stub').attributes('disabled')).toBe('false');
		expect(wrapper.find('table-bubble-menu-stub').exists()).toBe(true);
	});

	// versioned/draft items mount the form while loading, so the value arrives as a later prop change
	test('a lossy value that arrives after mount locks the editor', async () => {
		const { wrapper, editor } = await mountWithValue(null);

		expect(editor.isEditable).toBe(true);

		await wrapper.setProps({ value: '<marquee>legacy</marquee>' });
		await flushPromises();
		await nextTick();

		expect(editor.isEditable).toBe(false);
	});

	// custom-format marks live only on this editor instance; the guard's round-trip must know them
	// or their stored markup falsely reads as lossy and locks the editor (ENG-1474)
	test('a value using a configured custom format mounts editable', async () => {
		const { editor } = await mountWithValue('<p><cite class="src">quoted</cite></p>', {
			customFormats: [{ title: 'Cite', inline: 'cite', classes: 'src' }],
		});

		expect(editor.isEditable).toBe(true);
	});

	test('cancelling the warning keeps the editor read-only', async () => {
		const { wrapper, editor } = await mountWithValue('<marquee>legacy</marquee>');

		await wrapper.findComponent(EditorContent).trigger('click');
		findDialog(wrapper).vm.$emit('cancel');
		await flushPromises();
		await nextTick();

		expect(editor.isEditable).toBe(false);
	});
});
