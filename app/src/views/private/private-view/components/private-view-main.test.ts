import { createTestingPinia } from '@pinia/testing';
import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, onBeforeUnmount, ref } from 'vue';
import { createI18n } from 'vue-i18n';
import { createMemoryHistory, createRouter } from 'vue-router';
import PrivateViewMain from './private-view-main.vue';

const isMobileRef = ref(false);

vi.mock('@vueuse/core', async () => {
	const actual = await vi.importActual<typeof import('@vueuse/core')>('@vueuse/core');
	return {
		...actual,
		useBreakpoints: vi.fn(() => ({
			smallerOrEqual: vi.fn(() => isMobileRef),
		})),
		useLocalStorage: vi.fn((_key: string, defaultValue: unknown) => ref(defaultValue)),
		useResizeObserver: vi.fn(),
		useScroll: vi.fn(() => ({ x: ref(0), y: ref(0) })),
	};
});

vi.mock('@directus/utils/browser', () => ({ cssVar: vi.fn(() => '12') }));

vi.mock('@directus/vue-split-panel', () => ({
	SplitPanel: {
		props: ['size', 'collapsed', 'disabled', 'direction'],
		emits: ['update:size', 'update:collapsed'],
		template: `
      <div class="split-panel">
        <div class="sp-start"><slot name="start" /></div>
        <div class="sp-end"><slot name="end" /></div>
      </div>
    `,
	},
}));

vi.mock('./private-view-header-bar.vue', () => ({
	default: { template: '<div class="header-bar" />' },
}));

vi.mock('./private-view-resize-handle.vue', () => ({
	default: { template: '<div class="resize-handle" />' },
}));

// Mock PrivateViewSidebar to render a simple <aside id="sidebar"> so the
// id="sidebar" attribute-pass-through test still works, without pulling in
// reka-ui / AiSidebarDetail / server-store transitive deps.
vi.mock('./private-view-sidebar.vue', () => ({
	default: {
		inheritAttrs: true,
		template: '<aside v-bind="$attrs" role="contentinfo" class="sidebar"><slot name="sidebar" /></aside>',
	},
}));

// Mock PrivateViewDrawer to render its slot without the VDialog teleport.
vi.mock('./private-view-drawer.vue', () => ({
	default: {
		props: ['collapsed', 'placement', 'eager'],
		emits: ['update:collapsed'],
		template: '<div class="drawer"><slot /></div>',
	},
}));

vi.mock('../../components/notifications-group.vue', () => ({
	default: { template: '<div class="notifications" />' },
}));

vi.mock('../../components/skip-menu.vue', () => ({
	default: {
		props: ['section'],
		template: '<nav :data-section="section" class="skip-menu" />',
	},
}));

vi.mock('@/stores/user', () => ({
	useUserStore: () => ({ textDirection: 'ltr' }),
}));

const i18n = createI18n({ legacy: false, locale: 'en-US', messages: { 'en-US': {} } });

const router = createRouter({
	history: createMemoryHistory(),
	routes: [{ path: '/', component: { template: '<div />' } }],
});

const unmountSpy = vi.fn();

/** A stateful component that fires unmountSpy when destroyed. */
const StatefulChild = defineComponent({
	setup() {
		onBeforeUnmount(() => unmountSpy());
		return {};
	},
	template: '<div data-testid="stateful-child" />',
});

function mountPrivateViewMain(): VueWrapper {
	return mount(PrivateViewMain, {
		attachTo: document.body,
		props: {
			title: 'Test',
			inlineNav: true,
		},
		slots: {
			sidebar: StatefulChild,
		},
		global: {
			plugins: [i18n, createTestingPinia({ createSpy: vi.fn }), router],
			stubs: {
				Teleport: false,
			},
		},
	});
}

describe('PrivateViewMain sidebar single-instance', () => {
	let wrapper: VueWrapper;

	beforeEach(async () => {
		isMobileRef.value = false;
		await router.push('/');
		await router.isReady();
	});

	afterEach(() => {
		wrapper?.unmount();
		vi.clearAllMocks();
	});

	it('renders exactly one sidebar aside element', () => {
		wrapper = mountPrivateViewMain();
		const asides = document.body.querySelectorAll('aside[id="sidebar"]');
		expect(asides).toHaveLength(1);
	});

	it('still has exactly one sidebar aside when isMobile is true', async () => {
		wrapper = mountPrivateViewMain();
		isMobileRef.value = true;
		await wrapper.vm.$nextTick(); // flush reactive updates (isMobile change + watchers)
		await wrapper.vm.$nextTick(); // allow Teleport to settle in the new target

		const asides = document.body.querySelectorAll('aside[id="sidebar"]');
		expect(asides).toHaveLength(1);
	});

	it('does NOT remount the sidebar slot content when switching desktop → mobile', async () => {
		wrapper = mountPrivateViewMain();
		await wrapper.vm.$nextTick();

		isMobileRef.value = true;
		await wrapper.vm.$nextTick(); // flush reactive updates (isMobile change + watchers)
		await wrapper.vm.$nextTick(); // allow Teleport to settle in the new target

		// With v-if/v-else: onBeforeUnmount fires when desktop branch is destroyed → spy called
		// With Teleport: content never unmounts → spy never called
		expect(unmountSpy).not.toHaveBeenCalled();
	});

	it('does NOT remount the sidebar slot content when switching mobile → desktop', async () => {
		isMobileRef.value = true;
		wrapper = mountPrivateViewMain();
		await wrapper.vm.$nextTick();

		isMobileRef.value = false;
		await wrapper.vm.$nextTick(); // flush reactive updates (isMobile change + watchers)
		await wrapper.vm.$nextTick(); // allow Teleport to settle in the new target

		expect(unmountSpy).not.toHaveBeenCalled();
	});

	it('sidebar is inside #sidebar-desktop-outlet on desktop', () => {
		wrapper = mountPrivateViewMain();

		const desktopOutlet = document.body.querySelector('#sidebar-desktop-outlet');
		expect(desktopOutlet).not.toBeNull();
		expect(desktopOutlet!.querySelector('aside[id="sidebar"]')).not.toBeNull();
	});

	it('sidebar is inside #sidebar-mobile-outlet on mobile', async () => {
		wrapper = mountPrivateViewMain();
		isMobileRef.value = true;
		await wrapper.vm.$nextTick(); // flush reactive updates (isMobile change + watchers)
		await wrapper.vm.$nextTick(); // allow Teleport to settle in the new target

		const mobileOutlet = document.body.querySelector('#sidebar-mobile-outlet');
		expect(mobileOutlet).not.toBeNull();
		expect(mobileOutlet!.querySelector('aside[id="sidebar"]')).not.toBeNull();
	});

	it('sidebarStore.collapsed mirrors update:collapsed from drawer on mobile (regression: no double-negation)', async () => {
		isMobileRef.value = true;
		wrapper = mountPrivateViewMain();
		await wrapper.vm.$nextTick();

		// Dynamic import needed to get the pinia-aware store instance (created by createTestingPinia above)
		const { useSidebarStore } = await import('../stores/sidebar');
		const sidebarStore = useSidebarStore();

		// vi.mock replaces the module; import it here so findComponent can match by object identity
		const PrivateViewDrawerMock = (await import('./private-view-drawer.vue')).default;
		const drawerWrapper = wrapper.findComponent(PrivateViewDrawerMock);

		// Simulate drawer emitting collapsed=false (user opened it)
		await drawerWrapper.vm.$emit('update:collapsed', false);
		await wrapper.vm.$nextTick();
		expect(sidebarStore.collapsed).toBe(false);

		// Simulate drawer emitting collapsed=true (user closed it)
		await drawerWrapper.vm.$emit('update:collapsed', true);
		await wrapper.vm.$nextTick();
		expect(sidebarStore.collapsed).toBe(true);
	});
});
