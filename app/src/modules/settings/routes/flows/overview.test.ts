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

const createAllowedByCollection: Record<string, boolean> = {};

vi.mock('@/composables/use-permissions', () => ({
	useCollectionPermissions: (collection: string) => ({
		createAllowed: createAllowedByCollection[collection] ?? true,
	}),
}));

vi.mock('@/stores/license', () => ({
	useLicenseStore: () => ({
		limits: { flows: { remaining: 1, hasRemaining: true } },
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
	for (const collection of Object.keys(createAllowedByCollection)) delete createAllowedByCollection[collection];

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
		stubs: {
			'private-view': { template: '<div><slot name="actions:prepend" /><slot /></div>' },
			'flow-folder-sidebar': { template: '<div><slot /></div>' },
			'v-button': true,
			'v-icon': true,
			'settings-navigation': true,
			'sidebar-detail': true,
			'v-info': true,
			'v-table': true,
			'display-formatted-value': true,
			'v-menu': true,
			'v-list': true,
			'v-list-item': true,
			'v-list-item-icon': true,
			'v-list-item-content': true,
			'v-dialog': true,
			'v-card': true,
			'v-card-title': true,
			'v-card-actions': true,
			'flow-drawer': true,
			'add-folder': true,
			'router-view': true,
			'v-input': true,
			'v-card-text': true,
			'max-capacity-alert': true,
			'entitlement-limit-modal': true,
		},
		plugins: [router, i18n, createTestingPinia({ createSpy: vi.fn, stubActions: false })],
		directives: {
			tooltip: Tooltip,
		},
	};

	// Mock i18n.t to return the key to avoid translation warnings
	vi.spyOn(i18n.global, 't').mockImplementation((key: string | number) => String(key) as any);
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

	test('opens the duplicate dialog with the name prefilled', async () => {
		const wrapper = mount(FlowsOverview, { global });

		const vm = wrapper.vm as any;
		vm.openDuplicateFlow(mockFlow);

		expect(vm.duplicateDialogActive).toBe(true);
		expect(vm.duplicateName).toBe('Test Flow (copy)');
		expect(vm.duplicateSource).toEqual(mockFlow);
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

describe('FlowsOverview - selection', () => {
	test('clears the selection when the folder changes', async () => {
		const wrapper = mount(FlowsOverview, { global, props: { folder: 'folder-a' } });

		const vm = wrapper.vm as any;
		vm.selectedKeys = ['flow-1', 'flow-2'];

		await wrapper.setProps({ folder: 'folder-b' });

		expect(vm.selectedKeys).toEqual([]);
	});
});

describe('FlowsOverview - toggleFlowStatusById', () => {
	test('opens the limit modal when activating a Flow exceeds the license limit', async () => {
		const api = (await vi.importMock<{ default: { patch: ReturnType<typeof vi.fn> } }>('@/api')).default;

		api.patch.mockRejectedValue({
			response: { data: { errors: [{ extensions: { code: 'LIMIT_EXCEEDED' } }] } },
		});

		const { unexpectedError } = (await vi.importMock('@/utils/unexpected-error')) as {
			unexpectedError: ReturnType<typeof vi.fn>;
		};

		const wrapper = mount(FlowsOverview, { global });

		const vm = wrapper.vm as any;
		await vm.toggleFlowStatusById('flow-1', 'inactive');

		expect(api.patch).toHaveBeenCalledWith('/flows/flow-1', { status: 'active' });
		expect(vm.flowsLimitModalOpen).toBe(true);
		expect(unexpectedError).not.toHaveBeenCalled();
	});
});

describe('FlowsOverview - folder permissions', () => {
	test('folder creation follows directus_folders, not directus_flows', async () => {
		createAllowedByCollection['directus_folders'] = false;

		const wrapper = mount(FlowsOverview, { global });

		expect(wrapper.find('add-folder-stub').attributes('disabled')).toBe('true');
		expect((wrapper.vm as any).createAllowed).toBe(true);
	});

	test('folder creation is enabled when directus_folders create is allowed', async () => {
		createAllowedByCollection['directus_flows'] = false;

		const wrapper = mount(FlowsOverview, { global });

		expect(wrapper.find('add-folder-stub').attributes('disabled')).toBe('false');
	});
});

describe('FlowsOverview - empty state', () => {
	test('renders the empty state in a folder with no Flows, even when other folders have Flows', async () => {
		const wrapper = mount(FlowsOverview, { global, props: { folder: 'folder-empty' } });

		expect(wrapper.find('v-info-stub').exists()).toBe(true);
		expect(wrapper.find('v-table-stub').exists()).toBe(false);
	});

	test('renders the table when the current folder has Flows', async () => {
		const wrapper = mount(FlowsOverview, { global });

		expect(wrapper.find('v-table-stub').exists()).toBe(true);
		expect(wrapper.find('v-info-stub').exists()).toBe(false);
	});
});
