import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import type { Router } from 'vue-router';
import LivePreview from './live-preview.vue';
import { generateRouter } from '@/__utils__/router';
import { Tooltip } from '@/__utils__/tooltip';
import type { GlobalMountOptions } from '@/__utils__/types';
import { i18n } from '@/lang';

vi.mock('@/modules/visual/composables/use-visual-editor-urls', () => ({
	useVisualEditorUrls: () => ({ urlTemplates: ref([]), firstResolvedUrl: ref(null), resolveUrls: () => [] }),
}));

vi.mock('@directus/composables', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@directus/composables')>();
	return { ...actual, useElementSize: vi.fn(() => ({ width: ref(0), height: ref(0) })) };
});

vi.mock('@directus/vue-split-panel', () => ({
	SplitPanel: { template: '<div><slot name="start" /><slot name="end" /></div>' },
}));

const stubs = {
	VButton: true,
	VIcon: true,
	VInfo: true,
	VListItemContent: true,
	VListItemIcon: true,
	VListItem: true,
	VList: true,
	VMenu: true,
	VProgressCircular: true,
	VSelect: true,
	VTextOverflow: true,
	EditingLayer: true,
	PrivateViewResizeHandle: true,
};

let router: Router;
let global: GlobalMountOptions;

beforeEach(() => {
	router = generateRouter([{ path: '/:pathMatch(.*)*', component: { template: '<div />' } }]);
	global = { plugins: [i18n, router], stubs, directives: { tooltip: Tooltip } };
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('IFrame source', () => {
	it('updates when both url and dynamicUrl props change', async () => {
		const wrapper = mount(LivePreview, {
			global,
			props: {
				url: ['https://example.com/?version=v1'],
				dynamicUrl: 'https://example.com/?version=v1',
			},
		});

		expect(wrapper.find('#frame').attributes('src')).toBe('https://example.com/?version=v1');

		// Simulate a version switch
		await wrapper.setProps({
			url: ['https://example.com/?version=v2'],
			dynamicUrl: 'https://example.com/?version=v2',
		});

		expect(wrapper.find('#frame').attributes('src')).toBe('https://example.com/?version=v2');
	});

	it('does not update when only dynamicUrl changes', async () => {
		const wrapper = mount(LivePreview, {
			global,
			props: {
				url: ['https://example.com/?version=v1'],
				dynamicUrl: 'https://example.com/?version=v1',
			},
		});

		expect(wrapper.find('#frame').attributes('src')).toBe('https://example.com/?version=v1');

		// Simulate in-iframe navigation
		await wrapper.setProps({ dynamicUrl: 'https://example.com/page2?version=v1' });

		expect(wrapper.find('#frame').attributes('src')).toBe('https://example.com/?version=v1');
	});
});

describe('Refreshing the preview', () => {
	let wrapper: VueWrapper;
	let replace: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		wrapper = mount(LivePreview, {
			global,
			props: { url: 'https://example.com/preview' },
		});

		replace = vi.fn();

		Object.defineProperty(wrapper.get('iframe').element, 'contentWindow', {
			value: { location: { replace } },
		});
	});

	afterEach(() => {
		wrapper.unmount();
	});

	it('uses replacement navigation when saving changes the preview URL', () => {
		window.refreshLivePreview('https://example.com/updated-preview');

		expect(replace).toHaveBeenCalledExactlyOnceWith('https://example.com/updated-preview');
	});

	it('uses replacement navigation to refresh the configured URL', () => {
		window.refreshLivePreview(null);

		expect(replace).toHaveBeenCalledExactlyOnceWith('https://example.com/preview');
	});

	it('resolves relative preview URLs against the editor document', () => {
		const frame = document.createElement('iframe');
		frame.src = '/updated-preview';

		window.refreshLivePreview('/updated-preview');

		expect(replace).toHaveBeenCalledExactlyOnceWith(frame.src);
	});

	it('allows another refresh after the previous navigation finishes loading', async () => {
		window.refreshLivePreview('https://example.com/first-preview');
		window.refreshLivePreview('https://example.com/second-preview');

		expect(replace).toHaveBeenCalledTimes(1);

		await wrapper.get('iframe').trigger('load');
		window.refreshLivePreview('https://example.com/second-preview');

		expect(replace).toHaveBeenNthCalledWith(2, 'https://example.com/second-preview');
	});
});
