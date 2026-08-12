import { FlowRaw } from '@directus/types';
import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { Router } from 'vue-router';
import FlowsOverview from './overview.vue';
import { generateRouter } from '@/__utils__/router';
import { Tooltip } from '@/__utils__/tooltip';
import type { GlobalMountOptions } from '@/__utils__/types';
import { i18n } from '@/lang';

vi.mock('@/api', () => ({
	default: {
		get: vi.fn(),
		post: vi.fn(),
		delete: vi.fn(),
		patch: vi.fn(),
	},
}));

vi.mock('@/stores/flows', () => ({
	useFlowsStore: () => ({
		flows: [
			{
				id: 'flow-1',
				name: 'Test Flow 1',
				status: 'active',
				icon: 'bolt',
				color: 'var(--theme--primary)',
			} as FlowRaw,
		],
		hydrate: vi.fn(),
	}),
}));

vi.mock('@/composables/use-permissions', () => ({
	useCollectionPermissions: () => ({
		createAllowed: true,
	}),
}));

const flowsLimit = { remaining: 1, hasRemaining: true };

vi.mock('@/stores/license', () => ({
	useLicenseStore: () => ({
		limits: { flows: flowsLimit },
		hydrate: vi.fn(),
	}),
}));

vi.mock('@/utils/unexpected-error', () => ({
	unexpectedError: vi.fn(),
}));

let router: Router;
let global: GlobalMountOptions;
let windowOpenSpy: any;
let routerPushSpy: any;

// Mock the router module - will be updated in beforeEach
vi.mock('@/router', () => {
	const mockRouter = {
		push: vi.fn(),
		resolve: vi.fn((route: string) => ({ href: route })),
	};

	return {
		router: mockRouter,
	};
});

beforeEach(async () => {
	router = generateRouter([
		{
			path: '/settings/flows',
			component: { template: '<div>Flows Overview</div>' },
		},
		{
			name: 'settings-flows-item',
			path: '/settings/flows/:primaryKey',
			component: { template: '<div>Flow Detail</div>' },
		},
	]);

	router.push('/settings/flows');
	await router.isReady();

	// Get the mocked router and update it to use our test router
	const routerModule = await vi.importMock<{ router: Router }>('@/router');
	routerModule.router.push = router.push.bind(router) as any;
	routerModule.router.resolve = router.resolve.bind(router) as any;

	// Spy on the mocked router's push method (which the component uses)
	routerPushSpy = vi.spyOn(routerModule.router, 'push');
	windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

	global = {
		stubs: [
			'private-view',
			'v-button',
			'v-icon',
			'settings-navigation',
			'sidebar-detail',
			'v-info',
			'v-table',
			'display-formatted-value',
			'v-menu',
			'v-list',
			'v-list-item',
			'v-list-item-icon',
			'v-list-item-content',
			'v-dialog',
			'v-card',
			'v-card-title',
			'v-card-actions',
			'flow-drawer',
			'router-view',
			'v-input',
			'v-card-text',
			'max-capacity-alert',
			'entitlement-limit-modal',
		],
		plugins: [router, i18n, createTestingPinia({ createSpy: vi.fn, stubActions: false })],
		directives: {
			tooltip: Tooltip,
		},
	};

	// Mock i18n.t to return the key to avoid translation warnings
	vi.spyOn(i18n.global, 't').mockImplementation((key: string | number) => String(key) as any);

	flowsLimit.remaining = 1;
	flowsLimit.hasRemaining = true;
});

describe('FlowsOverview - navigateToFlow', () => {
	test('normal click navigates in same tab using router.push', async () => {
		routerPushSpy.mockClear();

		const wrapper = mount(FlowsOverview, {
			global,
		});

		const mockFlow = {
			id: 'flow-1',
			name: 'Test Flow',
			status: 'active',
		} as FlowRaw;

		const mockEvent = {
			ctrlKey: false,
			metaKey: false,
			button: 0,
		} as MouseEvent;

		// Access the component instance and call navigateToFlow directly
		const vm = wrapper.vm as any;
		vm.navigateToFlow({ item: mockFlow, event: mockEvent });

		expect(routerPushSpy).toHaveBeenCalledWith({ name: 'settings-flows-item', params: { primaryKey: 'flow-1' } });
		expect(windowOpenSpy).not.toHaveBeenCalled();
	});

	test('Ctrl+click opens in new tab using window.open', async () => {
		routerPushSpy.mockClear();
		windowOpenSpy.mockClear();

		const wrapper = mount(FlowsOverview, {
			global,
		});

		const mockFlow = {
			id: 'flow-1',
			name: 'Test Flow',
			status: 'active',
		} as FlowRaw;

		const mockEvent = {
			ctrlKey: true,
			metaKey: false,
			button: 0,
		} as MouseEvent;

		const vm = wrapper.vm as any;
		vm.navigateToFlow({ item: mockFlow, event: mockEvent });

		expect(windowOpenSpy).toHaveBeenCalledWith(expect.stringContaining('/settings/flows/flow-1'), '_blank');

		expect(routerPushSpy).not.toHaveBeenCalled();
	});

	test('Cmd+click (metaKey) opens in new tab using window.open', async () => {
		routerPushSpy.mockClear();
		windowOpenSpy.mockClear();

		const wrapper = mount(FlowsOverview, {
			global,
		});

		const mockFlow = {
			id: 'flow-1',
			name: 'Test Flow',
			status: 'active',
		} as FlowRaw;

		const mockEvent = {
			ctrlKey: false,
			metaKey: true,
			button: 0,
		} as MouseEvent;

		const vm = wrapper.vm as any;
		vm.navigateToFlow({ item: mockFlow, event: mockEvent });

		expect(windowOpenSpy).toHaveBeenCalledWith(expect.stringContaining('/settings/flows/flow-1'), '_blank');

		expect(routerPushSpy).not.toHaveBeenCalled();
	});

	test('middle mouse button click opens in new tab using window.open', async () => {
		routerPushSpy.mockClear();
		windowOpenSpy.mockClear();

		const wrapper = mount(FlowsOverview, {
			global,
		});

		const mockFlow = {
			id: 'flow-1',
			name: 'Test Flow',
			status: 'active',
		} as FlowRaw;

		const mockEvent = {
			ctrlKey: false,
			metaKey: false,
			button: 1, // Middle mouse button
		} as MouseEvent;

		const vm = wrapper.vm as any;
		vm.navigateToFlow({ item: mockFlow, event: mockEvent });

		expect(windowOpenSpy).toHaveBeenCalledWith(expect.stringContaining('/settings/flows/flow-1'), '_blank');

		expect(routerPushSpy).not.toHaveBeenCalled();
	});
});

describe('FlowsOverview - openDuplicateFlow', () => {
	const mockFlow = {
		id: 'flow-1',
		name: 'Test Flow',
		status: 'active',
	} as FlowRaw;

	test('opens the duplicate dialog with the name prefilled while Flow capacity remains', async () => {
		const wrapper = mount(FlowsOverview, { global });

		const vm = wrapper.vm as any;
		vm.openDuplicateFlow(mockFlow);

		expect(vm.duplicateDialogActive).toBe(true);
		expect(vm.duplicateName).toBe('Test Flow (copy)');
		expect(vm.duplicateSource).toEqual(mockFlow);
		expect(vm.flowsLimitModalOpen).toBe(false);
	});

	test('opens the limit modal instead once Flow capacity is exhausted', async () => {
		flowsLimit.remaining = 0;
		flowsLimit.hasRemaining = false;

		const wrapper = mount(FlowsOverview, { global });

		const vm = wrapper.vm as any;
		vm.openDuplicateFlow(mockFlow);

		expect(vm.flowsLimitModalOpen).toBe(true);
		expect(vm.duplicateDialogActive).toBe(false);
		expect(vm.duplicateSource).toBeNull();
	});

	test('duplicating closes the dialog once the new Flow is created', async () => {
		const api = (await vi.importMock<{ default: { post: ReturnType<typeof vi.fn> } }>('@/api')).default;
		api.post.mockResolvedValue({ data: { data: { id: 'new-flow-id' } } });

		const wrapper = mount(FlowsOverview, { global });

		const vm = wrapper.vm as any;
		vm.openDuplicateFlow(mockFlow);

		await vm.duplicate();

		expect(api.post).toHaveBeenCalledWith(
			'/flows',
			expect.objectContaining({ name: 'Test Flow (copy)', status: 'inactive' }),
			expect.any(Object),
		);

		expect(vm.duplicateDialogActive).toBe(false);
	});
});
