import type { RichTextToolbarButton } from '@directus/extensions';
import TextAlign from '@tiptap/extension-text-align';
import StarterKit from '@tiptap/starter-kit';
import { Editor } from '@tiptap/vue-3';
import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { afterEach, describe, expect, test } from 'vitest';
import { createI18n } from 'vue-i18n';
import { createMemoryHistory, createRouter } from 'vue-router';
import { buildCustomFormats, type CustomFormat } from '../extensions/custom-formats';
import Toolbar from './toolbar.vue';

let editor: Editor;

function mountToolbar(
	toolbar: string[],
	customFormats: CustomFormat[] = [],
	contributedButtons: RichTextToolbarButton[] = [],
) {
	editor = new Editor({
		extensions: [StarterKit, TextAlign.configure({ types: ['heading', 'paragraph'] })],
		content: '<p>x</p>',
	});

	const pinia = createPinia();
	const i18n = createI18n({ legacy: false, locale: 'en-US', messages: { 'en-US': {} } });

	const router = createRouter({
		history: createMemoryHistory(),
		routes: [{ path: '/', component: { template: '<div />' } }],
	});

	return mount(Toolbar, {
		props: { editor, toolbar, customFormats, contributedButtons },
		global: { plugins: [pinia, i18n, router] },
	});
}

afterEach(() => editor?.destroy());

describe('Toolbar', () => {
	// initial availableWidth is Infinity, so everything is visible (no ResizeObserver fired)
	test('renders a separator between each visible group', () => {
		// format (bold,italic) + list (numlist) + view (fullscreen) = 3 groups => 2 separators
		const wrapper = mountToolbar(['bold', 'italic', 'numlist', 'fullscreen']);
		expect(wrapper.findAll('.toolbar-separator')).toHaveLength(2);
	});

	test('no "Show More" menu when everything fits', () => {
		const wrapper = mountToolbar(['bold', 'italic']);
		expect(wrapper.find('.toolbar-more').exists()).toBe(false);
	});

	test('renders one button per selected key when everything fits', () => {
		const keys = ['bold', 'italic', 'numlist', 'fullscreen'];
		const wrapper = mountToolbar(keys);
		// no overflow at Infinity width => no "Show More" activator
		expect(wrapper.find('.toolbar-more').exists()).toBe(false);
		expect(wrapper.findAll('.toolbar-button')).toHaveLength(keys.length);
	});

	test('renders an alignment group as a single popover trigger, not flat buttons', () => {
		const wrapper = mountToolbar(['alignleft', 'aligncenter', 'alignright', 'alignjustify']);
		// one collapsed popover trigger...
		expect(wrapper.findAll('.toolbar-popover')).toHaveLength(1);
		// ...and the four align icons are NOT in the visible row (they live inside the closed popover)
		expect(wrapper.find('.toolbar-more').exists()).toBe(false);
		expect(wrapper.findAll('.toolbar-button')).toHaveLength(1);
	});

	test('popover trigger sits alongside other groups', () => {
		const wrapper = mountToolbar(['bold', 'aligncenter', 'fullscreen']);
		expect(wrapper.findAll('.toolbar-popover')).toHaveLength(1);
		// format(bold) + align(popover) + view(fullscreen) => 2 separators
		expect(wrapper.findAll('.toolbar-separator')).toHaveLength(2);
	});

	test('auto-appends a styles dropdown when customFormats are provided', () => {
		const formats = buildCustomFormats([{ title: 'Highlight', inline: 'span', classes: 'hl' }]).formats;
		const wrapper = mountToolbar(['bold'], formats);
		expect(wrapper.find('.style-list-button').exists()).toBe(true);
	});

	test('auto-appends a styles dropdown for a block-only customFormats config', () => {
		const formats = buildCustomFormats([{ title: 'Dropcap', block: 'p', classes: 'dropcap' }]).formats;
		const wrapper = mountToolbar(['bold'], formats);
		expect(wrapper.find('.style-list-button').exists()).toBe(true);
	});

	test('no styles dropdown when customFormats is empty', () => {
		const wrapper = mountToolbar(['bold']);
		expect(wrapper.find('.style-list-button').exists()).toBe(false);
	});
});

describe('contributed buttons', () => {
	const callout: RichTextToolbarButton = { key: 'callout', icon: 'info', label: 'Callout', command: () => {} };

	test('renders a richtext extension button when the field selects its key', () => {
		const wrapper = mountToolbar(['bold', 'callout'], [], [callout]);
		expect(wrapper.findAll('.toolbar-button')).toHaveLength(2);
	});

	// the button only exists once the field opts the extension in, so an unknown key is dropped
	test('drops the key when the field enabled no extension that contributes it', () => {
		const wrapper = mountToolbar(['bold', 'callout']);
		expect(wrapper.findAll('.toolbar-button')).toHaveLength(1);
	});

	// this is the case the user hits: extension enabled, but the field never opted the key in
	test('renders nothing when the field does not select the key', () => {
		const wrapper = mountToolbar(['bold'], [], [callout]);
		expect(wrapper.findAll('.toolbar-button')).toHaveLength(1);
	});

	test('renders a namespaced contribution next to the core button it is named after', () => {
		const bold: RichTextToolbarButton = { key: 'spike:bold', icon: 'star', label: 'Spike', command: () => {} };
		const wrapper = mountToolbar(['bold', 'spike:bold'], [], [bold]);

		const icons = wrapper.findAll('.toolbar-button .v-icon i').map((icon) => icon.attributes('data-icon'));
		expect(icons).toEqual(['format_bold', 'star']);
	});

	test('keeps the core button when a contribution arrives with a bare core key', () => {
		const bold: RichTextToolbarButton = { key: 'bold', icon: 'star', label: 'Spike', command: () => {} };
		const wrapper = mountToolbar(['bold'], [], [bold]);

		const icons = wrapper.findAll('.toolbar-button .v-icon i').map((icon) => icon.attributes('data-icon'));
		expect(icons).toEqual(['format_bold']);
	});

	test('two extensions with the same button key both render', () => {
		const a: RichTextToolbarButton = { key: 'ext-a:callout', icon: 'info', label: 'A', command: () => {} };
		const b: RichTextToolbarButton = { key: 'ext-b:callout', icon: 'star', label: 'B', command: () => {} };
		const wrapper = mountToolbar(['ext-a:callout', 'ext-b:callout'], [], [a, b]);

		const icons = wrapper.findAll('.toolbar-button .v-icon i').map((icon) => icon.attributes('data-icon'));
		expect(icons).toEqual(['info', 'star']);
	});
});
