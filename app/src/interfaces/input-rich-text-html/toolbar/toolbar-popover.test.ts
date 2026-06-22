import TextAlign from '@tiptap/extension-text-align';
import StarterKit from '@tiptap/starter-kit';
import { Editor } from '@tiptap/vue-3';
import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { afterEach, describe, expect, test } from 'vitest';
import { createI18n } from 'vue-i18n';
import { createMemoryHistory, createRouter } from 'vue-router';
import type { ToolbarContext } from './buttons';
import type { RenderGroup } from './compute-toolbar-layout';
import ToolbarPopover from './toolbar-popover.vue';

const ctx = {} as ToolbarContext;
let editor: Editor;

const ALIGN_GROUP: RenderGroup = {
	id: 'align',
	popover: true,
	icon: 'segment', // distinct from any child icon to genuinely test the group.icon branch
	keys: ['alignleft', 'aligncenter', 'alignright', 'alignjustify'],
};

function makeEditor(content = '<p>x</p>') {
	editor = new Editor({
		element: document.createElement('div'),
		extensions: [StarterKit, TextAlign.configure({ types: ['heading', 'paragraph'] })],
		content,
	});

	editor.commands.selectAll();
	return editor;
}

function mountPopover() {
	const pinia = createPinia();
	const i18n = createI18n({ legacy: false, locale: 'en-US', messages: { 'en-US': {} } });

	const router = createRouter({
		history: createMemoryHistory(),
		routes: [{ path: '/', component: { template: '<div />' } }],
	});

	return mount(ToolbarPopover, {
		props: { group: ALIGN_GROUP, editor, context: ctx },
		global: { plugins: [pinia, i18n, router] },
	});
}

afterEach(() => editor?.destroy());

describe('ToolbarPopover', () => {
	test('trigger shows group.icon when no child is active', () => {
		makeEditor();
		const wrapper = mountPopover();

		expect(wrapper.html()).toContain('segment');
	});

	test('trigger reflects the active alignment', async () => {
		makeEditor();
		editor.chain().focus().setTextAlign('center').run();
		const wrapper = mountPopover();
		await wrapper.vm.$nextTick();
		expect(wrapper.html()).toContain('format_align_center');
	});
});
