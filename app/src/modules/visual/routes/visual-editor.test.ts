import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import type { Router } from 'vue-router';
import VisualEditor from './visual-editor.vue';
import { generateRouter } from '@/__utils__/router';
import { Tooltip } from '@/__utils__/tooltip';
import type { GlobalMountOptions } from '@/__utils__/types';
import { DRAFT_VERSION_KEY } from '@/constants';
import { i18n } from '@/lang';
import { getUrlRoute } from '@/modules/visual/utils/get-url-route';
import { analyzeTemplate, replaceVersion } from '@/modules/visual/utils/version-url';
import { useSettingsStore } from '@/stores/settings';

vi.mock('@unhead/vue', () => ({ useHead: vi.fn() }));

const mockSettingsUrls = (templates: string[]) => {
	useSettingsStore().settings!.visual_editor_urls = templates.map((url) => ({ url }));
};

const LivePreviewStub = {
	name: 'LivePreview',
	template: '<div class="live-preview"><slot name="append-url" /></div>',
	emits: ['select-url'],
};

const stubs = {
	TransitionExpand: { template: '<div><slot /></div>' },
	ModuleBar: true,
	LivePreview: LivePreviewStub,
	EditingLayer: true,
	AiConversation: true,
	AiMagicButton: true,
	NotificationDialogs: true,
	NotificationsGroup: true,
	PrivateViewDrawer: true,
	VButton: { template: '<button @click="$emit(\'click\')"><slot /></button>', emits: ['click'] },
	VMenu: {
		template: '<div class="v-menu"><slot name="activator" :toggle="() => {}" :active="false" /><slot /></div>',
	},
	VChip: { template: '<div class="v-chip" @click="$emit(\'click\')"><slot /></div>', emits: ['click'] },
	VList: { template: '<div class="v-list"><slot /></div>' },
	VListItem: {
		props: ['active', 'clickable'],
		template: '<div class="v-list-item" :class="{ active }" @click="$emit(\'click\')"><slot /></div>',
		emits: ['click'],
	},
	VListItemContent: { template: '<div><slot /></div>' },
	VIcon: true,
};

let router: Router;
let global: GlobalMountOptions;

beforeEach(() => {
	const pinia = createTestingPinia({
		createSpy: vi.fn,
		initialState: {
			settingsStore: { settings: {} },
			serverStore: { info: { ai_enabled: false } },
		},
	});

	setActivePinia(pinia);

	router = generateRouter([{ path: '/:pathMatch(.*)*', component: { template: '<div />' } }]);

	global = {
		plugins: [i18n, router, pinia],
		directives: { tooltip: Tooltip },
		stubs,
	};
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('Version selector', () => {
	it('is not rendered when the URL has no version template', () => {
		mockSettingsUrls(['https://example.com/preview']);

		const wrapper = mount(VisualEditor, {
			global,
			props: { dynamicUrl: 'https://example.com/preview' },
		});

		expect(wrapper.find('.version-select-activator').exists()).toBe(false);
	});

	it('is rendered when the URL matches a version template', () => {
		mockSettingsUrls(['https://example.com/?version={{$version}}']);

		const wrapper = mount(VisualEditor, {
			global,
			props: { dynamicUrl: 'https://example.com/?version=v1' },
		});

		expect(wrapper.find('.version-select-activator').exists()).toBe(true);
	});

	it('adds a new version to the list when the URL contains a custom version key', async () => {
		mockSettingsUrls(['https://example.com/?version={{$version}}']);

		const wrapper = mount(VisualEditor, {
			global,
			props: { dynamicUrl: `https://example.com/?version=${DRAFT_VERSION_KEY}` },
		});

		const initialCount = wrapper.findAll('.v-list-item').length;

		await wrapper.setProps({ dynamicUrl: 'https://example.com/?version=custom' });

		expect(wrapper.findAll('.v-list-item')).toHaveLength(initialCount + 1);
	});

	it('calls router.replace with the version-substituted URL when a version is selected', async () => {
		const template = 'https://example.com/?version={{$version}}';
		const currentUrl = `https://example.com/?version=`;
		mockSettingsUrls([template]);

		const replaceSpy = vi.spyOn(router, 'replace').mockResolvedValue(undefined);

		const wrapper = mount(VisualEditor, {
			global,
			props: { dynamicUrl: currentUrl },
		});

		await wrapper.findAll('.v-list-item')[1]!.trigger('click');

		const placement = analyzeTemplate(template);
		const newUrl = replaceVersion(currentUrl, placement, DRAFT_VERSION_KEY);
		expect(replaceSpy).toHaveBeenCalledWith(getUrlRoute(newUrl));
	});
});

describe('URL selection', () => {
	it('calls router.replace when navigating within the same origin', async () => {
		mockSettingsUrls([]);
		const replaceSpy = vi.spyOn(router, 'replace').mockResolvedValue(undefined);

		const wrapper = mount(VisualEditor, {
			global,
			props: { dynamicUrl: 'https://example.com/old' },
		});

		wrapper
			.findComponent({ name: 'LivePreview' })
			.vm.$emit('select-url', 'https://example.com/new', 'https://example.com/old');

		await nextTick();

		expect(replaceSpy).toHaveBeenCalledWith(getUrlRoute('https://example.com/new'));
	});

	it('calls window.location.assign when navigating to a different origin', async () => {
		mockSettingsUrls([]);
		const assignSpy = vi.spyOn(window.location, 'assign').mockImplementation(() => undefined);

		const wrapper = mount(VisualEditor, {
			global,
			props: { dynamicUrl: 'https://example.com/page' },
		});

		wrapper
			.findComponent({ name: 'LivePreview' })
			.vm.$emit('select-url', 'https://other-site.com/page', 'https://example.com/page');

		await nextTick();

		expect(assignSpy).toHaveBeenCalledWith(router.resolve(getUrlRoute('https://other-site.com/page')).href);
		assignSpy.mockRestore();
	});
});
