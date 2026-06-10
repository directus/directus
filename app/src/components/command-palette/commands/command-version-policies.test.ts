import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { RouteLocationNormalizedLoaded } from 'vue-router';
import { contentCommands } from './content';
import { copyApiUrlCommands } from './copy-api-url';
import { collectionItemFlowCommands } from './flows';

const mocks = vi.hoisted(() => ({
	visibleCollections: [] as any[],
	hasPermission: vi.fn(),
	getManualFlowsForCollection: vi.fn(),
	writeText: vi.fn(),
}));

const sdkMock = vi.hoisted(() => {
	const client: Record<string, any> = {
		request: vi.fn(),
	};

	client['with'] = vi.fn(() => client);
	return client;
});

// run-flow.vue statically imports v-form.vue, which transitively boots the extension
// registry and the realtime collab SDK at module-eval. These tests only exercise pure
// command-descriptor logic and never render the component, so stub it at the boundary.
vi.mock('@/components/v-form/v-form.vue', () => ({ default: {} }));

vi.mock('@/lang', () => ({
	i18n: {
		global: {
			t: (key: string) => key,
			te: () => false,
		},
	},
}));

vi.mock('@/stores/collections', () => ({
	useCollectionsStore: () => ({
		visibleCollections: mocks.visibleCollections,
	}),
}));

vi.mock('@/stores/permissions', () => ({
	usePermissionsStore: () => ({
		hasPermission: mocks.hasPermission,
	}),
}));

vi.mock('@/stores/flows', () => ({
	useFlowsStore: () => ({
		getManualFlowsForCollection: mocks.getManualFlowsForCollection,
	}),
}));

vi.mock('@/stores/notifications', () => ({
	useNotificationsStore: () => ({
		add: vi.fn(),
	}),
}));

vi.mock('@/stores/user', () => ({
	useUserStore: () => ({
		currentUser: { admin_access: false },
	}),
}));

vi.mock('@/sdk', () => ({
	default: sdkMock,
	sdk: sdkMock,
}));

vi.mock('@directus/sdk', () => ({
	triggerFlow: vi.fn(),
}));

vi.mock('@directus/utils', () => ({
	getEndpoint: (collection: string) => `/items/${collection}`,
}));

vi.mock('@/utils/get-root-path', () => ({
	getRootPath: () => '/',
	getPublicURL: () => 'https://example.com/',
}));

describe('command version policies', () => {
	beforeEach(() => {
		mocks.visibleCollections = [
			{ collection: 'posts', name: 'Posts', type: 'table', meta: {} },
			{ collection: 'pages', name: 'Pages', type: 'table', meta: {} },
		];

		mocks.hasPermission.mockReturnValue(true);

		mocks.getManualFlowsForCollection.mockReturnValue([
			{
				id: 'flow-1',
				name: 'Publish',
				trigger: 'manual',
				status: 'active',
				options: { collections: ['posts'] },
			},
		]);

		mocks.writeText.mockReset();

		Object.defineProperty(navigator, 'clipboard', {
			value: {
				writeText: mocks.writeText,
			},
			configurable: true,
		});
	});

	test('routes create item to current collection version context', () => {
		const commands = getCommands(
			contentCommands,
			route({
				path: '/content/posts/1',
				params: { collection: 'posts', primaryKey: '1' },
				query: { version: 'draft' },
			}),
		);

		const router = { push: vi.fn() };
		const command = commands.find((command: any) => command.id === 'create-item:posts');

		command.action({ router });

		expect(router.push).toHaveBeenCalledWith('/content/posts/+?version=draft');
	});

	test('does not apply current version context to other collections', () => {
		const commands = getCommands(
			contentCommands,
			route({
				path: '/content/posts/1',
				params: { collection: 'posts', primaryKey: '1' },
				query: { version: 'draft' },
			}),
		);

		const router = { push: vi.fn() };
		const command = commands.find((command: any) => command.id === 'create-item:pages');

		command.action({ router });

		expect(router.push).toHaveBeenCalledWith('/content/pages/+');
	});

	test('hides collection flow commands in version context', () => {
		const commands = getCommands(
			collectionItemFlowCommands,
			route({
				path: '/content/posts/1',
				params: { collection: 'posts', primaryKey: '1' },
				query: { version: 'draft' },
			}),
		);

		expect(commands).toEqual([]);
		expect(mocks.getManualFlowsForCollection).not.toHaveBeenCalled();
	});

	test('copies versioned item API URLs with version query', () => {
		const commands = getCommands(
			copyApiUrlCommands,
			route({
				path: '/content/posts/1',
				params: { collection: 'posts', primaryKey: '1' },
				query: { version: 'draft' },
			}),
		);

		commands[0].action();

		expect(mocks.writeText).toHaveBeenCalledWith('https://example.com/items/posts/1?version=draft');
	});

	test('hides copy API URL command on itemless draft routes', () => {
		const commands = getCommands(
			copyApiUrlCommands,
			route({
				path: '/content/posts/+',
				params: { collection: 'posts', primaryKey: '+' },
				query: { version: 'draft', versionId: 'version-1' },
			}),
		);

		expect(commands).toEqual([]);
	});
});

function route(overrides: Partial<RouteLocationNormalizedLoaded>) {
	return {
		path: '',
		params: {},
		query: {},
		...overrides,
	} as RouteLocationNormalizedLoaded;
}

function getCommands(commands: { commands?: any }, route: RouteLocationNormalizedLoaded) {
	if (typeof commands.commands === 'function') {
		return commands.commands({ route, search: '' });
	}

	return commands.commands ?? [];
}
