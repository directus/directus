import StarterKit from '@tiptap/starter-kit';
import { Editor } from '@tiptap/vue-3';
import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { afterEach, describe, expect, test } from 'vitest';
import { createI18n } from 'vue-i18n';
import { createMemoryHistory, createRouter } from 'vue-router';
import Toolbar from './toolbar.vue';

const i18n = createI18n({ legacy: false, locale: 'en-US', messages: { 'en-US': {} } });

const router = createRouter({
	history: createMemoryHistory(),
	routes: [{ path: '/', component: { template: '<div />' } }],
});

let editor: Editor;

function mountToolbar(toolbar: string[]) {
	editor = new Editor({ extensions: [StarterKit], content: '<p>x</p>' });
	return mount(Toolbar, { props: { editor, toolbar }, global: { plugins: [createPinia(), i18n, router] } });
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

	test('applies the ghost button class', () => {
		const wrapper = mountToolbar(['bold']);
		expect(wrapper.find('.toolbar-button').exists()).toBe(true);
	});
});
