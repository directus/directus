import { EditorContent } from '@tiptap/vue-3';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { describe, expect, test } from 'vitest';
import { nextTick } from 'vue';
import { createI18n } from 'vue-i18n';
import Interface from './input-rich-text-html.vue';
import InterfaceInputCode from '@/interfaces/input-code/input-code.vue';

/**
 * Comparison view of a value the schema can't represent: rendering it through the editor would
 * silently drop the unsupported markup, so the revision would look empty and restoring it would be
 * impossible to judge. Those values fall back to a read-only source view instead.
 */
const LOSSY = '<p>hello</p><marquee>legacy</marquee>';
const DIFF_MARKED = '<p>hello<span class="comparison-diff--added"> world</span></p>';

async function mountComparison(value: string) {
	const i18n = createI18n({ legacy: false, locale: 'en-US', messages: { 'en-US': {} } });

	const wrapper = mount(Interface, {
		props: { value, comparisonMode: true, nonEditable: true },
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
	return wrapper;
}

// isVisible() is unreliable for v-show under jsdom; assert on the inline style it toggles
function editorContentHidden(wrapper: Awaited<ReturnType<typeof mountComparison>>) {
	return (wrapper.findComponent(EditorContent).attributes('style') ?? '').includes('display: none');
}

describe('comparison mode source fallback', () => {
	test('unsupported markup is shown as read-only source instead of being dropped by the editor', async () => {
		const wrapper = await mountComparison(LOSSY);

		const code = wrapper.findComponent(InterfaceInputCode);
		expect(code.exists()).toBe(true);
		expect(code.props('value')).toBe(LOSSY);
		expect(code.props('disabled')).toBe(true);
		expect(editorContentHidden(wrapper)).toBe(true);
	});

	test('diff-marked values still render in the editor', async () => {
		const wrapper = await mountComparison(DIFF_MARKED);

		expect(wrapper.findComponent(InterfaceInputCode).exists()).toBe(false);
		expect(editorContentHidden(wrapper)).toBe(false);
	});

	test('the source fallback never emits, so opening a comparison cannot dirty the field', async () => {
		const wrapper = await mountComparison(LOSSY);

		expect(wrapper.emitted('input')).toBeUndefined();
		expect(wrapper.emitted('setFieldValue')).toBeUndefined();
	});
});
