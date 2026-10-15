import TextAlign from '@tiptap/extension-text-align';
import StarterKit from '@tiptap/starter-kit';
import { Editor } from '@tiptap/vue-3';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { nextTick } from 'vue';
import { createI18n } from 'vue-i18n';
import { createMemoryHistory, createRouter } from 'vue-router';
import { editorExtensions } from '../extensions';
import { buildCustomFormats, type CustomFormat } from '../extensions/custom-formats';
import ColorMenu from './menus/color-menu.vue';
import StyleListMenu from './menus/style-list-menu.vue';
import Toolbar from './toolbar.vue';
import { Tooltip } from '@/__utils__/tooltip';
import { directive as clickOutside } from '@/directives/click-outside';

const resizeObserver = vi.hoisted(() => ({ callback: undefined as ((entries: unknown[]) => void) | undefined }));

vi.mock('@vueuse/core', async () => {
	const actual = await vi.importActual<typeof import('@vueuse/core')>('@vueuse/core');

	return {
		...actual,
		useResizeObserver: (_target: unknown, callback: (entries: unknown[]) => void) => {
			resizeObserver.callback = callback;
		},
	};
});

let editor: Editor;

function mountToolbar(toolbar: string[], customFormats: CustomFormat[] = []) {
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

	return mount(Toolbar, { props: { editor, toolbar, customFormats }, global: { plugins: [pinia, i18n, router] } });
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

describe('Toolbar overflow menu', () => {
	const OVERFLOWING_TOOLBAR = [
		'bold',
		'italic',
		'underline',
		'strikethrough',
		'subscript',
		'fontfamily',
		'fontsize',
		'forecolor',
		'backcolor',
		'h1',
	];

	let wrapper: VueWrapper | undefined;

	beforeEach(() => {
		const outlet = document.createElement('div');
		outlet.id = 'menu-outlet';
		document.body.appendChild(outlet);
	});

	afterEach(() => {
		wrapper?.unmount();
		wrapper = undefined;
		document.getElementById('menu-outlet')?.remove();
	});

	async function settle() {
		await flushPromises();
		await new Promise((resolve) => setTimeout(resolve));
	}

	async function openOverflowMenu() {
		editor = new Editor({ extensions: editorExtensions, content: '<p>x</p>' });

		const i18n = createI18n({ legacy: false, locale: 'en-US', missingWarn: false, fallbackWarn: false });

		const router = createRouter({
			history: createMemoryHistory(),
			routes: [{ path: '/', component: { template: '<div />' } }],
		});

		wrapper = mount(Toolbar, {
			props: { editor, toolbar: OVERFLOWING_TOOLBAR },
			attachTo: document.body,
			global: {
				plugins: [createPinia(), i18n, router],
				directives: { tooltip: Tooltip, 'click-outside': clickOutside },
			},
		});

		resizeObserver.callback!([{ borderBoxSize: [{ inlineSize: 100 }] }]);
		await nextTick();

		await wrapper.find('.toolbar-more button').trigger('click');
		await settle();

		return wrapper;
	}

	function overflowIsOpen() {
		return document.querySelector('#menu-outlet .toolbar-overflow') !== null;
	}

	function styleList(attr: 'fontFamily' | 'fontSize') {
		return wrapper!.findAllComponents(StyleListMenu).find((menu) => menu.props('attr') === attr)!;
	}

	function colorMenu(mode: 'text' | 'background') {
		return wrapper!.findAllComponents(ColorMenu).find((menu) => menu.props('mode') === mode)!;
	}

	test('moves the font and color controls into the overflow menu', async () => {
		await openOverflowMenu();

		expect(overflowIsOpen()).toBe(true);
		expect(document.querySelectorAll('#menu-outlet .toolbar-overflow .style-list-button')).toHaveLength(2);
		expect(wrapper!.findAllComponents(ColorMenu)).toHaveLength(2);
	});

	test.each(['fontFamily', 'fontSize'] as const)(
		'opens the %s dropdown without closing the overflow menu',
		async (attr) => {
			await openOverflowMenu();

			await styleList(attr).find('button').trigger('click');
			await settle();

			expect(overflowIsOpen()).toBe(true);
			expect(document.querySelector('#menu-outlet .style-list')).not.toBeNull();
		},
	);

	test.each(['text', 'background'] as const)(
		'opens the %s color picker without closing the overflow menu',
		async (mode) => {
			await openOverflowMenu();

			await colorMenu(mode).find('button').trigger('click');
			await settle();

			expect(overflowIsOpen()).toBe(true);
			expect(document.querySelector('#menu-outlet .color-menu')).not.toBeNull();
		},
	);

	test('keeps both menus open while interacting with the color picker', async () => {
		await openOverflowMenu();

		await colorMenu('text').find('button').trigger('click');
		await settle();

		document.querySelector<HTMLInputElement>('#menu-outlet .color-menu input:not([type="color"])')!.click();
		await settle();

		expect(overflowIsOpen()).toBe(true);
		expect(document.querySelector('#menu-outlet .color-menu')).not.toBeNull();
	});

	test('applies the picked font size from inside the overflow menu', async () => {
		await openOverflowMenu();
		editor.commands.selectAll();

		await styleList('fontSize').find('button').trigger('click');
		await settle();

		const option = [...document.querySelectorAll<HTMLElement>('#menu-outlet .style-list .v-list-item')].find(
			(item) => item.textContent?.trim() === '24',
		)!;

		option.click();
		await settle();

		expect(editor.getAttributes('textStyle').fontSize).toBe('24px');
		expect(overflowIsOpen()).toBe(true);
	});

	test('closes an open dropdown when another one in the overflow menu is opened', async () => {
		await openOverflowMenu();

		await colorMenu('text').find('button').trigger('click');
		await settle();

		await styleList('fontSize').find('button').trigger('click');
		await settle();

		expect(overflowIsOpen()).toBe(true);
		expect(document.querySelector('#menu-outlet .color-menu')).toBeNull();
		expect(document.querySelector('#menu-outlet .style-list')).not.toBeNull();
	});

	test('closes the overflow menu after a plain button inside it is clicked', async () => {
		await openOverflowMenu();

		document.querySelector<HTMLElement>('#menu-outlet .toolbar-overflow > .v-button button')!.click();
		await settle();

		expect(editor.isActive('heading', { level: 1 })).toBe(true);
		expect(overflowIsOpen()).toBe(false);
	});
});
