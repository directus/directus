import { useRichTextEditable } from '@directus/composables';
import { mergeAttributes, Node } from '@tiptap/core';
import {
	type Editor,
	EditorContent,
	NodeViewContent,
	nodeViewProps,
	NodeViewWrapper,
	VueNodeViewRenderer,
} from '@tiptap/vue-3';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { afterEach, describe, expect, test } from 'vitest';
import { computed, defineComponent, h, nextTick } from 'vue';
import { createI18n, useI18n } from 'vue-i18n';
import Interface from './input-rich-text-html.vue';
import ContributedBubbleMenu from './toolbar/menus/contributed-bubble-menu.vue';
import Toolbar from './toolbar/toolbar.vue';
import { registerRichTexts } from '@/rich-text/register';

const Callout = Node.create({
	name: 'callout',
	group: 'block',
	content: 'block+',
	parseHTML: () => [{ tag: 'div[data-callout]' }],
	renderHTML: ({ HTMLAttributes }) => ['div', mergeAttributes(HTMLAttributes, { 'data-callout': '' }), 0],
});

const callout = { key: 'callout', icon: 'info', label: 'Callout', command: () => {} };

const bubbleMenu = { key: 'menu', shouldShow: () => true, buttons: [callout] };

const config = { id: 'ext', name: 'Callout', extensions: [Callout], buttons: [callout], bubbleMenus: [bubbleMenu] };

async function mountInterface(props: Record<string, unknown> = {}) {
	const i18n = createI18n({ legacy: false, locale: 'en-US', messages: { 'en-US': { greeting: 'Hello' } } });

	const wrapper = mount(Interface, {
		props: { value: '<p>hi</p>', extensions: ['ext'], toolbar: ['ext:callout'], ...props },
		global: {
			plugins: [createPinia(), i18n],
			stubs: {
				Toolbar: true,
				TableBubbleMenu: true,
				ContributedBubbleMenu: true,
				ImageDrawer: true,
				LinkDrawer: true,
				MediaDrawer: true,
				SourceCodeDrawer: true,
				NormalizationWarningDialog: true,
				InterfaceInputCode: true,
				VNotice: true,
			},
		},
	});

	await flushPromises();
	await nextTick();
	const editor = wrapper.findComponent(EditorContent).props('editor') as Editor;
	return { wrapper, editor };
}

afterEach(() => registerRichTexts([]));

// a contributed button only reaches the user through the toolbar, so the toolbar props decide its state
describe('contributed buttons in each editor mode', () => {
	test('hands the buttons to an editable toolbar', async () => {
		registerRichTexts([config]);
		const { wrapper } = await mountInterface();
		const toolbar = wrapper.findComponent(Toolbar);

		expect(toolbar.props('contributedButtons')!.map((b: { key: string }) => b.key)).toEqual(['ext:callout']);
		expect(toolbar.props('disabled')).toBe(false);
	});

	test('renders no toolbar in readonly mode', async () => {
		registerRichTexts([config]);
		const { wrapper } = await mountInterface({ nonEditable: true });
		expect(wrapper.findComponent(Toolbar).exists()).toBe(false);
	});

	test('renders no toolbar in comparison mode', async () => {
		registerRichTexts([config]);
		const { wrapper } = await mountInterface({ comparisonMode: true });
		expect(wrapper.findComponent(Toolbar).exists()).toBe(false);
	});

	test('disables the toolbar of a disabled field', async () => {
		registerRichTexts([config]);
		const { wrapper } = await mountInterface({ disabled: true });
		expect(wrapper.findComponent(Toolbar).props('disabled')).toBe(true);
	});

	// the field did not enable the extension that owns the callout, so the value locks
	test('disables the toolbar of a locked field', async () => {
		registerRichTexts([config, { id: 'other', name: 'Other', buttons: [{ ...callout, key: 'other' }] }]);

		const { wrapper } = await mountInterface({
			value: '<div data-callout=""><p>hi</p></div>',
			extensions: ['other'],
			toolbar: ['other:other'],
		});

		expect(wrapper.emitted('readonly')?.at(-1)).toEqual([true]);
		expect(wrapper.findComponent(Toolbar).props('disabled')).toBe(true);
	});
});

describe('contributed bubble menus in each editor mode', () => {
	test('hands the menus of the enabled extensions to the bubble menu', async () => {
		registerRichTexts([config]);
		const { wrapper } = await mountInterface();
		const menu = wrapper.findComponent(ContributedBubbleMenu);

		expect(menu.props('menus').map((m: { key: string }) => m.key)).toEqual(['ext:menu']);
	});

	test('renders no bubble menu when the field enabled no menu', async () => {
		registerRichTexts([config]);
		const { wrapper } = await mountInterface({ extensions: [] });
		expect(wrapper.findComponent(ContributedBubbleMenu).exists()).toBe(false);
	});

	test.each([
		['readonly', { nonEditable: true }],
		['comparison', { comparisonMode: true }],
		['disabled', { disabled: true }],
	])('renders no bubble menu in %s mode', async (_, props) => {
		registerRichTexts([config]);
		const { wrapper } = await mountInterface(props);
		expect(wrapper.findComponent(ContributedBubbleMenu).exists()).toBe(false);
	});

	// `setEditable` changes neither selection nor doc, so an open menu would never re-run `shouldShow`
	test('removes the bubble menu when the field becomes disabled', async () => {
		registerRichTexts([config]);
		const { wrapper } = await mountInterface();

		await wrapper.setProps({ disabled: true });
		expect(wrapper.findComponent(ContributedBubbleMenu).exists()).toBe(false);
	});

	test('renders no bubble menu in a locked field', async () => {
		registerRichTexts([config, { id: 'other', name: 'Other', bubbleMenus: [bubbleMenu] }]);

		const { wrapper } = await mountInterface({ value: '<div data-callout=""><p>hi</p></div>', extensions: ['other'] });

		expect(wrapper.emitted('readonly')?.at(-1)).toEqual([true]);
		expect(wrapper.findComponent(ContributedBubbleMenu).exists()).toBe(false);
	});
});

// an extension's node view mounts through the shared @tiptap/vue-3, inside the app's Vue context
describe('contributed Vue node views', () => {
	const CardView = defineComponent({
		props: nodeViewProps,
		setup() {
			const { t } = useI18n();
			const editable = useRichTextEditable();
			const mode = computed(() => (editable.value ? 'edit' : 'view'));

			return () =>
				h(NodeViewWrapper, { class: 'card-view', 'data-mode': mode.value }, () => [
					h('span', { class: 'card-greeting', contenteditable: 'false' }, t('greeting')),
					h(NodeViewContent, { class: 'card-content' }),
				]);
		},
	});

	const Card = Node.create({
		name: 'card',
		group: 'block',
		content: 'inline*',
		parseHTML: () => [{ tag: 'div[data-card]' }],
		renderHTML: ({ HTMLAttributes }) => ['div', mergeAttributes(HTMLAttributes, { 'data-card': '' }), 0],
		addNodeView: () => VueNodeViewRenderer(CardView),
	});

	const card = '<div data-card="">hi</div><p>end</p>';

	function mountCard(props: Record<string, unknown> = {}) {
		registerRichTexts([{ id: 'card', name: 'Card', extensions: [Card] }]);
		return mountInterface({ value: card, extensions: ['card'], toolbar: [], ...props });
	}

	test('renders the node view with its editable content', async () => {
		const { wrapper } = await mountCard();

		expect(wrapper.find('.card-view').exists()).toBe(true);
		expect(wrapper.find('.card-content').text()).toBe('hi');
	});

	test('resolves the app i18n instance inside the node view', async () => {
		const { wrapper } = await mountCard();
		expect(wrapper.find('.card-greeting').text()).toBe('Hello');
	});

	test('saves the markup of renderHTML, not of the node view', async () => {
		const { editor } = await mountCard();

		expect(editor.getHTML()).toBe(card);
		expect(editor.getHTML()).not.toContain('card-view');
	});

	test('raises no unsupported-markup lock for its own markup', async () => {
		const { wrapper } = await mountCard();
		expect(wrapper.emitted('readonly')?.at(-1)).toEqual([false]);
	});

	test('mounts in edit mode in an editable field', async () => {
		const { wrapper } = await mountCard();
		expect(wrapper.find('.card-view').attributes('data-mode')).toBe('edit');
	});

	test('mounts in view mode in a readonly field', async () => {
		const { wrapper } = await mountCard({ nonEditable: true });
		expect(wrapper.find('.card-view').attributes('data-mode')).toBe('view');
	});

	// the field locks after mount (collab lock, form loading), and `editor.isEditable` is not reactive
	test('switches to view mode when the field becomes disabled', async () => {
		const { wrapper } = await mountCard();

		await wrapper.setProps({ disabled: true });
		await nextTick();
		expect(wrapper.find('.card-view').attributes('data-mode')).toBe('view');
	});

	test('mounts in view mode in a comparison field', async () => {
		const { wrapper } = await mountCard({ comparisonMode: true });
		expect(wrapper.find('.card-view').attributes('data-mode')).toBe('view');
	});
});
