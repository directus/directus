import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { RouteLocationNormalizedLoaded } from 'vue-router';
import { deploymentsCommands } from './deployments';
import { filesCommands } from './files';
import { insightsCommands } from './insights';
import { usersCommands } from './users';
import type { CommandConfig, GroupConfig } from '../composables/use-command-registry';

const mocks = vi.hoisted(() => ({
	hasPermission: vi.fn(),
	isAdmin: false,
	dashboards: [] as any[],
	modules: [] as any[],
	settings: {} as any,
	deploymentProviders: [] as any[],
	deploymentProvidersLoaded: false,
	fetchDeployments: vi.fn(),
	refreshRegisteredCommands: vi.fn(),
}));

vi.mock('./search/search-collection.vue', () => ({ default: {} }));

vi.mock('../composables/use-command-registry', async (importOriginal) => ({
	...(await importOriginal<typeof import('../composables/use-command-registry')>()),
	refreshRegisteredCommands: mocks.refreshRegisteredCommands,
}));

vi.mock('@/lang', () => ({
	i18n: {
		global: {
			t: (key: string, params?: Record<string, string>) => {
				if (!params) return key;
				return Object.entries(params).reduce((value, [param, replacement]) => {
					return value.replace(`{${param}}`, replacement);
				}, key);
			},
		},
	},
}));

vi.mock('@/stores/permissions', () => ({
	usePermissionsStore: () => ({
		hasPermission: mocks.hasPermission,
	}),
}));

vi.mock('@/stores/user', () => ({
	useUserStore: () => ({
		get isAdmin() {
			return mocks.isAdmin;
		},
		get currentUser() {
			return { admin_access: mocks.isAdmin };
		},
	}),
}));

vi.mock('@/stores/insights', () => ({
	useInsightsStore: () => ({
		get dashboards() {
			return mocks.dashboards;
		},
	}),
}));

vi.mock('@/stores/settings', () => ({
	useSettingsStore: () => ({
		get settings() {
			return mocks.settings;
		},
	}),
}));

vi.mock('@/extensions', () => ({
	useExtensions: () => ({
		modules: {
			get value() {
				return mocks.modules;
			},
		},
	}),
}));

vi.mock('@/modules/deployment/composables/use-deployment-navigation', () => ({
	useDeploymentNavigation: () => ({
		providers: {
			get value() {
				return mocks.deploymentProviders;
			},
		},
		loaded: {
			get value() {
				return mocks.deploymentProvidersLoaded;
			},
		},
		fetch: mocks.fetchDeployments,
	}),
}));

describe('module route commands', () => {
	beforeEach(() => {
		mocks.hasPermission.mockReset();
		mocks.hasPermission.mockReturnValue(false);
		mocks.isAdmin = false;
		mocks.dashboards = [];
		mocks.modules = [{ id: 'deployments' }];
		mocks.settings = { module_bar: [{ type: 'module', id: 'deployments', enabled: true }] };
		mocks.deploymentProviders = [];
		mocks.deploymentProvidersLoaded = false;
		mocks.fetchDeployments.mockReset();
		mocks.refreshRegisteredCommands.mockReset();
	});

	test('adds user search when user read is allowed', async () => {
		mocks.hasPermission.mockImplementation((collection, action) => {
			return collection === 'directus_users' && action === 'read';
		});

		const commands = await getCommands(usersCommands);

		expect(commands.map(({ id }) => id)).toContain('search-users');
	});

	test('hides user commands when user read is denied', async () => {
		const commands = await getCommands(usersCommands);

		expect(commands).toEqual([]);
	});

	test('hides module command groups when read is denied', async () => {
		expect(await getGroups(filesCommands)).toEqual([]);
		expect(await getGroups(insightsCommands)).toEqual([]);
		expect(await getGroups(usersCommands)).toEqual([]);
		expect(await getGroups(deploymentsCommands)).toEqual([]);
	});

	test('adds module command groups when read is allowed', async () => {
		mocks.hasPermission.mockReturnValue(true);

		expect((await getGroups(filesCommands)).map(({ id }) => id)).toEqual(['collection:directus_files']);
		expect((await getGroups(insightsCommands)).map(({ id }) => id)).toEqual(['collection:directus_dashboards']);
		expect((await getGroups(usersCommands)).map(({ id }) => id)).toEqual(['collection:directus_users']);
		expect((await getGroups(deploymentsCommands)).map(({ id }) => id)).toEqual(['module:deployments']);
	});

	test('gates file navigation and upload separately', async () => {
		mocks.hasPermission.mockImplementation((collection, action) => {
			return collection === 'directus_files' && ['read', 'create'].includes(action);
		});

		const commands = await getCommands(filesCommands);

		expect(commands.map(({ id }) => id)).toEqual(expect.arrayContaining(['view-files', 'search-files', 'upload-file']));
	});

	test('adds insight overview, search, and loaded dashboards when dashboard read is allowed', async () => {
		mocks.hasPermission.mockImplementation((collection, action) => {
			return collection === 'directus_dashboards' && action === 'read';
		});

		mocks.dashboards = [{ id: 'sales', name: 'Sales', icon: 'bar_chart' }];

		const commands = await getCommands(insightsCommands);

		expect(commands.map(({ id }) => id)).toEqual(
			expect.arrayContaining(['view-insights', 'search-dashboards', 'view-dashboard:sales']),
		);
	});

	test('hides deployment commands when deployments module is disabled', async () => {
		mocks.settings = { module_bar: [{ type: 'module', id: 'deployments', enabled: false }] };
		mocks.hasPermission.mockReturnValue(true);

		const commands = await getCommands(deploymentsCommands);

		expect(commands).toEqual([]);
		expect(mocks.fetchDeployments).not.toHaveBeenCalled();
	});

	test('does not block command collection on deployment fetch', () => {
		mocks.hasPermission.mockImplementation((collection, action) => {
			return collection === 'directus_deployments' && action === 'read';
		});

		mocks.fetchDeployments.mockReturnValue(new Promise(() => {}));

		const commands = getCommandConfigs(deploymentsCommands);

		expect(Array.isArray(commands)).toBe(true);
		expect((commands as CommandConfig[]).map(({ id }) => id)).toContain('view-deployments');
		expect(mocks.fetchDeployments).toHaveBeenCalledOnce();
	});

	test('refreshes commands after deployment providers load', async () => {
		mocks.hasPermission.mockImplementation((collection, action) => {
			return collection === 'directus_deployments' && action === 'read';
		});

		mocks.fetchDeployments.mockImplementation(() => {
			mocks.deploymentProviders = [{ provider: 'vercel', projects: [] }];
			mocks.deploymentProvidersLoaded = true;
			return Promise.resolve();
		});

		getCommandConfigs(deploymentsCommands);

		expect(mocks.refreshRegisteredCommands).not.toHaveBeenCalled();

		await Promise.resolve();

		expect(mocks.refreshRegisteredCommands).toHaveBeenCalledOnce();
	});

	test('does not refetch deployment providers after an empty provider list loaded', () => {
		mocks.hasPermission.mockImplementation((collection, action) => {
			return collection === 'directus_deployments' && action === 'read';
		});

		mocks.deploymentProvidersLoaded = true;

		getCommandConfigs(deploymentsCommands);
		getCommandConfigs(deploymentsCommands, { path: 'deploy' });

		expect(mocks.fetchDeployments).not.toHaveBeenCalled();
	});

	test('gates deployment provider, project, and settings commands', async () => {
		mocks.hasPermission.mockImplementation((collection, action) => {
			return (
				(collection === 'directus_deployments' && ['read', 'update'].includes(action)) ||
				(collection === 'directus_deployment_runs' && action === 'read')
			);
		});

		mocks.deploymentProviders = [
			{
				provider: 'vercel',
				projects: [{ id: 'site', name: 'Site' }],
			},
		];
		mocks.deploymentProvidersLoaded = true;

		const commands = await getCommands(deploymentsCommands);

		expect(commands.map(({ id }) => id)).toEqual(
			expect.arrayContaining([
				'view-deployments',
				'view-deployments-provider:vercel',
				'view-deployments-project:vercel:site',
				'deployment-settings:vercel',
			]),
		);
	});
});

function route(overrides: Partial<RouteLocationNormalizedLoaded> = {}) {
	return {
		path: '',
		params: {},
		query: {},
		...overrides,
	} as RouteLocationNormalizedLoaded;
}

async function getCommands(
	commands: { commands?: any },
	routeOverrides: Partial<RouteLocationNormalizedLoaded> = {},
): Promise<CommandConfig[]> {
	if (typeof commands.commands === 'function') {
		return commands.commands({ route: route(routeOverrides), search: '' });
	}

	return commands.commands ?? [];
}

function getCommandConfigs(
	commands: { commands?: any },
	routeOverrides: Partial<RouteLocationNormalizedLoaded> = {},
): CommandConfig[] {
	if (typeof commands.commands === 'function') {
		return commands.commands({ route: route(routeOverrides), search: '' });
	}

	return commands.commands ?? [];
}

async function getGroups(commands: { groups?: any }): Promise<GroupConfig[]> {
	if (typeof commands.groups === 'function') {
		return commands.groups({ route: route(), search: '' });
	}

	return commands.groups ?? [];
}
