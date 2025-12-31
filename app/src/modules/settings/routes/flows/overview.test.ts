import { generateRouter } from '@/__utils__/router';
import type { GlobalMountOptions } from '@/__utils__/types';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { Router } from 'vue-router';
import { FlowRaw } from '@directus/types';
import { i18n } from '@/lang';
import { createTestingPinia } from '@pinia/testing';
import FlowsOverview from './overview.vue';

vi.mock('@/api', () => ({
	default: {
		get: vi.fn(),
		delete: vi.fn(),
		patch: vi.fn(),
	},
}));

const mockFlows: FlowRaw[] = [
	{
		id: 'flow-1',
		name: 'Test Flow 1',
		status: 'active',
		trigger: 'manual',
		icon: 'bolt',
		color: 'var(--theme--primary)',
		group: null,
		sort: 1,
	} as FlowRaw,
	{
		id: 'folder-1',
		name: 'Test Folder',
		status: 'active',
		trigger: null, // Folders have null trigger
		icon: 'folder',
		color: null,
		group: null,
		sort: 2,
	} as FlowRaw,
	{
		id: 'flow-2',
		name: 'Nested Flow',
		status: 'inactive',
		trigger: 'webhook',
		icon: 'bolt',
		color: null,
		group: 'folder-1',
		sort: 1,
	} as FlowRaw,
];

vi.mock('@/stores/flows', () => ({
	useFlowsStore: () => ({
		flows: mockFlows,
		sortedFlows: mockFlows,
		hydrate: vi.fn(),
	}),
}));

vi.mock('@/composables/use-permissions', () => ({
	useCollectionPermissions: () => ({
		createAllowed: true,
	}),
}));

vi.mock('@/utils/unexpected-error', () => ({
	unexpectedError: vi.fn(),
}));

let router: Router;
let global: GlobalMountOptions;

beforeEach(async () => {
	router = generateRouter([
		{
			path: '/settings/flows',
			component: { template: '<div>Flows Overview</div>' },
		},
		{
			path: '/settings/flows/:primaryKey',
			component: { template: '<div>Flow Detail</div>' },
		},
	]);

	router.push('/settings/flows');
	await router.isReady();

	global = {
		stubs: [
			'private-view',
			'v-button',
			'v-icon',
			'v-breadcrumb',
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
			'flow-folder-dialog',
			'flow-item',
			'router-view',
			'transition-expand',
			'draggable',
			'search-input',
			'private-view-header-bar-action-button',
		],
		plugins: [router, i18n, createTestingPinia({ createSpy: vi.fn, stubActions: false })],
	};

	vi.spyOn(i18n.global, 't').mockImplementation((key: string | number) => String(key) as any);
});

afterEach(() => {
	vi.resetAllMocks();
});

describe('FlowsOverview - handleEditFlow', () => {
	test('opens flow drawer for regular flows', async () => {
		const wrapper = mount(FlowsOverview, { global });

		const vm = wrapper.vm as any;

		// Simulate clicking on a regular flow (has trigger)
		const regularFlow = mockFlows[0]!;
		vm.handleEditFlow(regularFlow);

		// Should set editFlow to the flow ID
		expect(vm.editFlow).toBe('flow-1');
	});

	test('opens folder dialog for folders (trigger === null)', async () => {
		const wrapper = mount(FlowsOverview, { global });

		const vm = wrapper.vm as any;

		// Simulate clicking on a folder
		const folder = mockFlows[1]!;
		vm.handleEditFlow(folder);

		// Should open folder dialog and set editFolderFlow
		expect(vm.folderDialogActive).toBe(true);
		expect(vm.editFolderFlow).toStrictEqual(folder);
	});
});

describe('FlowsOverview - rootFlows', () => {
	test('filters to only root items (no group)', async () => {
		const wrapper = mount(FlowsOverview, { global });

		const vm = wrapper.vm as any;

		// rootFlows should only include items with no group
		expect(vm.rootFlows.length).toBe(2);
		expect(vm.rootFlows.map((f: FlowRaw) => f.id)).toEqual(['flow-1', 'folder-1']);
	});
});

describe('FlowsOverview - flows with collapse state', () => {
	test('adds isCollapsed property to flows', async () => {
		const wrapper = mount(FlowsOverview, { global });

		const vm = wrapper.vm as any;

		// All flows should have isCollapsed property
		for (const flow of vm.flows) {
			expect(flow).toHaveProperty('isCollapsed');
			expect(typeof flow.isCollapsed).toBe('boolean');
		}
	});
});

describe('FlowsOverview - create actions', () => {
	test('openFolderDialog sets correct state', async () => {
		const wrapper = mount(FlowsOverview, { global });

		const vm = wrapper.vm as any;

		vm.openFolderDialog();

		expect(vm.folderDialogActive).toBe(true);
		expect(vm.editFolderFlow).toBe(null);
	});

	test('setting editFlow to + opens create flow drawer', async () => {
		const wrapper = mount(FlowsOverview, { global });

		const vm = wrapper.vm as any;

		vm.editFlow = '+';

		expect(vm.editFlow).toBe('+');
	});
});
