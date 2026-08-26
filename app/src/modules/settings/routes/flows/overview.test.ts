import { FlowRaw } from '@directus/types';
import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ref } from 'vue';
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
				name: 'Send email',
				status: 'active',
				icon: 'bolt',
				color: 'var(--theme--primary)',
				description: 'Notify the team',
				folder: 'folder-a',
			} as FlowRaw,
			{
				id: 'flow-2',
				name: 'Sync data',
				status: 'inactive',
				icon: 'bolt',
				description: 'Nightly job',
			} as FlowRaw,
		],
		hydrate: vi.fn(),
	}),
}));

vi.mock('@/composables/use-folders', () => ({
	useFolders: () => ({
		loading: ref(false),
		folders: ref([{ id: 'folder-a', name: 'Notifications', parent: null }]),
		nestedFolders: ref([]),
		fetchFolders: vi.fn(),
		openFolders: ref([]),
	}),
}));

const relationalFields = ['directus_flows.folder', 'directus_flows.user_created', 'directus_folders.parent'];

vi.mock('@/stores/relations', () => ({
	useRelationsStore: () => ({
		getRelationsForField: (collection: string, field: string) =>
			relationalFields.includes(`${collection}.${field}`) ? [{}] : [],
	}),
}));

type CollectionActions = Partial<Record<'create' | 'update' | 'delete', boolean>>;

const permissionsByCollection: Record<string, CollectionActions> = {};

vi.mock('@/composables/use-permissions', () => ({
	useCollectionPermissions: (collection: string) => ({
		createAllowed: permissionsByCollection[collection]?.create ?? true,
		updateAllowed: permissionsByCollection[collection]?.update ?? true,
		deleteAllowed: permissionsByCollection[collection]?.delete ?? true,
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
	// Search and filter persist to localStorage, so isolate each test
	localStorage.clear();

	for (const collection of Object.keys(permissionsByCollection)) delete permissionsByCollection[collection];

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
			'private-view': { template: '<div><slot name="actions" /><slot /></div>' },
			'flow-folder-sidebar': {
				props: ['actionsDisabled'],
				template: '<div :data-actions-disabled="actionsDisabled"><slot /></div>',
			},
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
			'search-input': { props: ['modelValue', 'filter'], template: '<div />' },
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
		permissionsByCollection['directus_folders'] = { create: false };

		const wrapper = mount(FlowsOverview, { global });

		expect(wrapper.find('add-folder-stub').attributes('disabled')).toBe('true');
		expect((wrapper.vm as any).createAllowed).toBe(true);
	});

	test('folder creation is enabled when directus_folders create is allowed', async () => {
		permissionsByCollection['directus_flows'] = { create: false };

		const wrapper = mount(FlowsOverview, { global });

		expect(wrapper.find('add-folder-stub').attributes('disabled')).toBe('false');
	});

	test('folder context actions stay enabled with only update or only delete on directus_folders', async () => {
		permissionsByCollection['directus_folders'] = { create: false, delete: false };

		const wrapper = mount(FlowsOverview, { global });

		expect(wrapper.find('[data-actions-disabled]').attributes('data-actions-disabled')).toBe('false');
	});

	test('folder context actions are disabled without update or delete on directus_folders', async () => {
		permissionsByCollection['directus_folders'] = { update: false, delete: false };

		const wrapper = mount(FlowsOverview, { global });

		expect(wrapper.find('[data-actions-disabled]').attributes('data-actions-disabled')).toBe('true');
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

describe('FlowsOverview - search and filter', () => {
	test('search narrows the list to name or description matches', async () => {
		const wrapper = mount(FlowsOverview, { global });
		const vm = wrapper.vm as any;

		vm.search = 'sync';
		await wrapper.vm.$nextTick();

		expect(vm.flows.map((flow: FlowRaw) => flow.id)).toEqual(['flow-2']);
	});

	test('filter narrows the list using Directus filter rules', async () => {
		const wrapper = mount(FlowsOverview, { global });
		const vm = wrapper.vm as any;

		vm.filter = { status: { _eq: 'active' } };
		await wrapper.vm.$nextTick();

		expect(vm.flows.map((flow: FlowRaw) => flow.id)).toEqual(['flow-1']);
	});

	test('shows the no-results empty state when a query matches nothing', async () => {
		const wrapper = mount(FlowsOverview, { global });
		const vm = wrapper.vm as any;

		vm.search = 'no-such-flow';
		await wrapper.vm.$nextTick();

		expect(vm.flows).toEqual([]);
		expect(wrapper.find('v-info-stub').exists()).toBe(true);
		expect(wrapper.find('v-table-stub').exists()).toBe(false);
	});

	test('filter matches against the related folder rather than its ID', async () => {
		const wrapper = mount(FlowsOverview, { global });
		const vm = wrapper.vm as any;

		vm.filter = { folder: { name: { _eq: 'Notifications' } } };
		await wrapper.vm.$nextTick();

		expect(vm.flows.map((flow: FlowRaw) => flow.id)).toEqual(['flow-1']);
		// The list keeps the flow's own shape, so the folder stays a foreign key
		expect(vm.flows[0].folder).toBe('folder-a');
	});

	test('only offers relational filter fields that can be resolved in memory', () => {
		const wrapper = mount(FlowsOverview, { global });
		const vm = wrapper.vm as any;

		expect(vm.isFilterableField({ collection: 'directus_flows', field: 'status' })).toBe(true);
		expect(vm.isFilterableField({ collection: 'directus_flows', field: 'folder' })).toBe(true);
		expect(vm.isFilterableField({ collection: 'directus_folders', field: 'name' })).toBe(true);
		expect(vm.isFilterableField({ collection: 'directus_folders', field: 'parent' })).toBe(false);
		expect(vm.isFilterableField({ collection: 'directus_flows', field: 'user_created' })).toBe(false);
	});

	test('persists the filter to localStorage as JSON so it survives a reload', async () => {
		const wrapper = mount(FlowsOverview, { global });
		const vm = wrapper.vm as any;

		vm.filter = { status: { _eq: 'active' } };
		await wrapper.vm.$nextTick();

		expect(JSON.parse(localStorage.getItem('directus-flows-filter')!)).toEqual({ status: { _eq: 'active' } });
	});

	test('clearFilters restores the full list', async () => {
		const wrapper = mount(FlowsOverview, { global });
		const vm = wrapper.vm as any;

		vm.search = 'sync';
		vm.filter = { status: { _eq: 'inactive' } };
		await wrapper.vm.$nextTick();
		expect(vm.flows.length).toBe(1);

		vm.clearFilters();
		await wrapper.vm.$nextTick();

		expect(vm.search).toBeNull();
		expect(vm.filter).toBeNull();
		expect(vm.flows.length).toBe(2);
	});
});
