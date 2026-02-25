import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import type { Router } from 'vue-router';
import LivePreview from './live-preview.vue';
import { generateRouter } from '@/__utils__/router';
import { Tooltip } from '@/__utils__/tooltip';
import type { GlobalMountOptions } from '@/__utils__/types';
import { i18n } from '@/lang';

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
