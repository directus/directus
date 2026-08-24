import type { Flow } from '@directus/types';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('@directus/env', () => ({
	useEnv: vi.fn().mockReturnValue({
		EMAIL_TEMPLATES_PATH: './templates',
		STORAGE_LOCATIONS: ['local'],
		REDIS_ENABLED: false,
		EXTENSIONS_PATH: './extensions',
	}),
}));

vi.mock('./logger/index.js', () => ({
	useLogger: vi.fn().mockReturnValue({
		warn: vi.fn(),
		info: vi.fn(),
		debug: vi.fn(),
		error: vi.fn(),
	}),
}));

vi.mock('./bus/index.js', () => ({
	useBus: vi.fn().mockReturnValue({
		subscribe: vi.fn(),
		publish: vi.fn(),
	}),
}));

vi.mock('./database/index.js', () => ({
	default: vi.fn(),
}));

vi.mock('./utils/get-schema.js', () => ({
	getSchema: vi.fn().mockResolvedValue({}),
}));

vi.mock('./services/flows.js', () => ({
	FlowsService: vi.fn().mockImplementation(() => ({
		readByQuery: vi.fn().mockResolvedValue([]),
	})),
}));

vi.mock('./utils/schedule.js', () => ({
	scheduleSynchronizedJob: vi.fn(),
	validateCron: vi.fn().mockReturnValue(true),
}));

vi.mock('./emitter.js', () => ({
	default: {
		onAction: vi.fn(),
		onFilter: vi.fn(),
		offAction: vi.fn(),
		offFilter: vi.fn(),
	},
}));

vi.mock('./cache.js', () => ({
	getCache: vi.fn().mockReturnValue({ cache: null, systemCache: null, lockCache: null }),
	getCacheValue: vi.fn(),
	setCacheValue: vi.fn(),
	clearSystemCache: vi.fn(),
}));

vi.mock('./redis/utils/redis-config-available.js', () => ({
	redisConfigAvailable: vi.fn().mockReturnValue(false),
}));

vi.mock('./services/notifications.js', () => ({
	NotificationsService: vi.fn(),
}));

vi.mock('./permissions/cache.js', () => ({
	withCache: vi.fn((fn: any) => fn),
}));

vi.mock('./permissions/lib/fetch-permissions.js', () => ({
	fetchPermissions: vi.fn().mockResolvedValue([]),
}));

vi.mock('./permissions/lib/fetch-policies.js', () => ({
	fetchPolicies: vi.fn().mockResolvedValue([]),
}));

vi.mock('./services/activity.js', () => ({
	ActivityService: vi.fn(),
}));

vi.mock('./services/revisions.js', () => ({
	RevisionsService: vi.fn(),
}));

vi.mock('./services/index.js', () => ({}));

vi.mock('./utils/get-service.js', () => ({
	getService: vi.fn(),
}));

vi.mock('./utils/redact-object.js', () => ({
	redactObject: vi.fn((obj: any) => obj),
}));

vi.mock('./utils/construct-flow-tree.js', () => ({
	constructFlowTree: vi.fn((flow: Flow) => flow),
}));

describe('FlowManager', () => {
	let getFlowManager: typeof import('./flows.js').getFlowManager;

	beforeEach(async () => {
		vi.resetModules();
		const module = await import('./flows.js');
		getFlowManager = module.getFlowManager;
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	test('getFlow returns undefined when no flows are loaded', () => {
		const manager = getFlowManager();
		expect(manager.getFlow('nonexistent')).toBeUndefined();
	});

	test('getFlow returns flow after load populates it', async () => {
		const mockFlow = {
			id: 'test-flow-id',
			name: 'Test Flow',
			status: 'active',
			trigger: 'manual',
			operations: [],
			options: {},
		} as unknown as Flow;

		const { FlowsService } = await import('./services/flows.js');

		vi.mocked(FlowsService).mockImplementation(
			() =>
				({
					readByQuery: vi.fn().mockResolvedValue([mockFlow]),
				}) as any,
		);

		const manager = getFlowManager();

		await manager.initialize();

		expect(manager.getFlow('test-flow-id')).toEqual(mockFlow);
	});

	describe('runWebhookFlow manual trigger authentication', () => {
		const manualFlow = {
			id: 'manual-flow-id',
			name: 'Manual Flow',
			status: 'active',
			trigger: 'manual',
			operations: [],
			operation: null,
			accountability: null,
			options: { collections: ['articles'], requireSelection: false },
		} as unknown as Flow;

		const publicAccountability = {
			role: null,
			user: null,
			roles: [],
			admin: false,
			app: false,
		} as any;

		beforeEach(async () => {
			const { FlowsService } = await import('./services/flows.js');

			vi.mocked(FlowsService).mockImplementation(
				() =>
					({
						readByQuery: vi.fn().mockResolvedValue([manualFlow]),
					}) as any,
			);
		});

		const runArgs = (accountability: any) =>
			['POST-manual-flow-id', { body: { collection: 'articles' } }, { accountability, schema: {} as any }] as const;

		const REJECTED_CASES = [
			{ name: 'public/unauthenticated accountability', accountability: publicAccountability },
			{ name: 'undefined accountability', accountability: undefined },
			{
				name: 'share-only accountability',
				accountability: { ...publicAccountability, share: 'share-id' },
			},
		];

		const ALLOWED_CASES = [
			{
				name: 'authenticated user accountability',
				accountability: { ...publicAccountability, user: 'user-id', admin: true },
			},
			{
				name: 'authenticated role-only accountability',
				accountability: { ...publicAccountability, role: 'role-id', admin: true },
			},
		];

		test.each(REJECTED_CASES)('throws ForbiddenError for $name', async ({ accountability }) => {
			// Arrange
			const manager = getFlowManager();
			await manager.initialize();

			// Act
			const trigger = manager.runWebhookFlow(...runArgs(accountability));

			// Assert
			await expect(trigger).rejects.toMatchObject({ code: 'FORBIDDEN' });
		});

		test.each(ALLOWED_CASES)('triggers the flow for $name', async ({ accountability }) => {
			// Arrange
			const manager = getFlowManager();
			await manager.initialize();

			// Act
			const trigger = manager.runWebhookFlow(...runArgs(accountability));

			// Assert
			await expect(trigger).resolves.toHaveProperty('result');
		});
	});
});
