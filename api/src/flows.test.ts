import type { FlowRaw } from '@directus/types';
import knex from 'knex';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useBus } from './bus/index.js';
import emitter from './emitter.js';
import { withResolvers } from './test-utils/async.js';
import { createMockBus } from './test-utils/bus.js';

const { readByQuery, getSchema, scheduleSynchronizedJob } = vi.hoisted(() => ({
	readByQuery: vi.fn(async (): Promise<unknown[]> => []),
	getSchema: vi.fn(async (): Promise<unknown> => ({})),
	scheduleSynchronizedJob: vi.fn(() => ({ stop: vi.fn(async () => {}) })),
}));

vi.mock('@directus/env', async () => {
	const { mockUseEnv } = await import('./test-utils/env.js');
	return mockUseEnv();
});

vi.mock('./logger/index.js', async () => {
	const { createMockLogger } = await import('./test-utils/logger.js');
	return { useLogger: () => createMockLogger() };
});

vi.mock('./emitter.js', async () => {
	const { mockEmitter } = await import('./test-utils/emitter.js');
	return mockEmitter();
});

vi.mock('./database/index.js', async () => {
	const { mockDatabase } = await import('./test-utils/database.js');
	return mockDatabase();
});

vi.mock('./bus/index.js');
vi.mock('./services/index.js', () => ({}));
vi.mock('./permissions/lib/fetch-permissions.js', () => ({ fetchPermissions: vi.fn() }));
vi.mock('./permissions/lib/fetch-policies.js', () => ({ fetchPolicies: vi.fn() }));

vi.mock('./services/flows.js', () => ({
	FlowsService: vi.fn(function () {
		return { readByQuery };
	}),
}));

vi.mock('./utils/get-schema.js', () => ({ getSchema }));
vi.mock('./utils/schedule.js', () => ({ scheduleSynchronizedJob, validateCron: () => true }));
vi.mock('./utils/redact-object.js', () => ({ redactObject: vi.fn((obj: unknown) => obj) }));

function flushPromises() {
	return new Promise((resolve) => setImmediate(resolve));
}

function createFlow(id: string, trigger = 'operation', options: Record<string, unknown> = {}) {
	return { id, trigger, options, operations: [], operation: null, accountability: null } as unknown as FlowRaw;
}

describe('FlowManager', () => {
	let getFlowManager: typeof import('./flows.js').getFlowManager;
	let TimeoutError: typeof import('./utils/with-timeout.js').TimeoutError;
	let bus: ReturnType<typeof createMockBus>['bus'];

	beforeEach(async () => {
		// A fresh bus per test, so the managers of earlier tests don't receive its messages
		bus = createMockBus().bus;
		vi.mocked(useBus).mockReturnValue(bus as any);

		// flows.ts keeps its manager as a module singleton, so it's re-imported after a reset for a fresh one.
		// Mocked modules survive the reset, so only real modules have to be re-imported to match flows.ts
		vi.resetModules();
		({ getFlowManager } = await import('./flows.js'));
		({ TimeoutError } = await import('./utils/with-timeout.js'));
	});

	afterEach(() => {
		vi.useRealTimers();
		// Restores the mocks to their defaults, dropping any leftover once values
		vi.resetAllMocks();
	});

	test.each([
		['log', true],
		['ai-text', true],
		['item-read', false],
	])('redacts secrets from flow data before a %s step: %s', async (type, redacted) => {
		const { redactObject } = await import('./utils/redact-object.js');
		const { FLOW_SECRET_KEYS } = await import('./constants.js');

		const manager = getFlowManager();
		manager.addOperation(type, vi.fn());

		const operation = { type, options: {}, resolve: null, reject: null } as any;
		await (manager as any).executeOperation(operation, { $trigger: {} });

		const calls = vi.mocked(redactObject).mock.calls.filter(([, redact]) => redact.keys === FLOW_SECRET_KEYS);
		expect(calls.length > 0).toBe(redacted);
	});

	async function initializeWith(flows: FlowRaw[]) {
		readByQuery.mockResolvedValueOnce(flows);

		const manager = getFlowManager();
		await manager.initialize();

		return manager;
	}

	describe('initialize', () => {
		test('should load the active flows', async () => {
			const manager = await initializeWith([createFlow('flow-a')]);

			expect(readByQuery).toHaveBeenCalledWith(expect.objectContaining({ filter: { status: { _eq: 'active' } } }));
			expect(manager.getFlow('flow-a')).toBeDefined();
		});

		test('should skip initializing again when already initialized', async () => {
			const manager = await initializeWith([createFlow('flow-a')]);

			await manager.initialize();

			expect(readByQuery).toHaveBeenCalledTimes(1);
		});

		test('should queue a reload requested during the initial load', async () => {
			const initialRead = withResolvers<FlowRaw[]>();
			readByQuery.mockReturnValueOnce(initialRead.promise).mockResolvedValueOnce([createFlow('flow-b')]);

			const manager = getFlowManager();
			const initialize = manager.initialize();

			await manager.reload();
			initialRead.resolve([createFlow('flow-a')]);
			await initialize;
			await flushPromises();

			expect(readByQuery).toHaveBeenCalledTimes(2);
			expect(manager.getFlow('flow-b')).toBeDefined();
		});

		test('should reject when the initial load fails', async () => {
			const error = new Error('Connection terminated unexpectedly');
			readByQuery.mockRejectedValue(error);

			await expect(getFlowManager().initialize()).rejects.toBe(error);
		});
	});

	describe('reload', () => {
		test('should retry reading the flows when it fails', async () => {
			vi.useFakeTimers({ toFake: ['setTimeout'] });

			const manager = await initializeWith([createFlow('flow-a')]);

			readByQuery
				.mockRejectedValueOnce(new Error('Connection terminated unexpectedly'))
				.mockResolvedValueOnce([createFlow('flow-b')]);

			await manager.reload();
			await vi.runAllTimersAsync();

			// The initial load, the failed read and the retry
			expect(readByQuery).toHaveBeenCalledTimes(3);
			expect(manager.getFlow('flow-a')).toBeUndefined();
			expect(manager.getFlow('flow-b')).toBeDefined();
		});

		test('should keep the loaded flows when reading the flows keeps failing', async () => {
			vi.useFakeTimers({ toFake: ['setTimeout'] });

			const manager = await initializeWith([createFlow('flow-a')]);

			readByQuery.mockRejectedValue(new Error('Connection terminated unexpectedly'));
			await manager.reload();
			await vi.runAllTimersAsync();

			// The initial load, the failed read and both failed retries
			expect(readByQuery).toHaveBeenCalledTimes(4);
			expect(manager.getFlow('flow-a')).toBeDefined();
		});

		test.each([
			{
				name: 'KnexTimeoutError',
				createError: () => new knex.KnexTimeoutError('Knex: Timeout acquiring a connection'),
			},
			// Created in the test, as TimeoutError is only imported after the module reset
			{ name: 'TimeoutError', createError: () => new TimeoutError('Timeout of 10000ms exceeded') },
		])('should not retry reading the flows on a $name', async ({ createError }) => {
			vi.useFakeTimers({ toFake: ['setTimeout'] });

			const manager = await initializeWith([createFlow('flow-a')]);

			readByQuery.mockRejectedValueOnce(createError());
			await manager.reload();
			await vi.runAllTimersAsync();

			// The initial load and the timed out read
			expect(readByQuery).toHaveBeenCalledTimes(2);
			expect(manager.getFlow('flow-a')).toBeDefined();
		});

		test('should load the latest flows on the next reload after loading the flows failed', async () => {
			const manager = await initializeWith([]);

			readByQuery.mockResolvedValueOnce([
				createFlow('action-flow', 'event', { type: 'action', scope: ['items.create'], collections: ['articles'] }),
				createFlow('schedule-flow', 'schedule', { cron: '* * * * *' }),
			]);

			scheduleSynchronizedJob.mockImplementationOnce(() => {
				throw new Error('Failed to schedule');
			});

			await manager.reload();
			await flushPromises();

			const [event, partiallyLoadedHandler] = vi.mocked(emitter.onAction).mock.calls[0]!;

			readByQuery.mockResolvedValueOnce([createFlow('flow-b')]);
			await manager.reload();
			await flushPromises();

			expect(emitter.offAction).toHaveBeenCalledWith(event, partiallyLoadedHandler);
			expect(manager.getFlow('action-flow')).toBeUndefined();
			expect(manager.getFlow('flow-b')).toBeDefined();
		});

		test('should skip the reload when the flows are not initialized yet', async () => {
			await getFlowManager().reload();
			await flushPromises();

			expect(readByQuery).not.toHaveBeenCalled();
		});

		test('should skip a reload while another one is already waiting', async () => {
			const manager = await initializeWith([createFlow('flow-a')]);

			const runningRead = withResolvers<FlowRaw[]>();
			readByQuery.mockReturnValueOnce(runningRead.promise).mockResolvedValueOnce([createFlow('flow-b')]);

			// Running, waiting, and skipped
			await manager.reload();
			await manager.reload();
			await manager.reload();
			runningRead.resolve([createFlow('flow-a')]);
			await flushPromises();

			expect(readByQuery).toHaveBeenCalledTimes(3);
			expect(manager.getFlow('flow-b')).toBeDefined();
		});

		test('should finish the reload when stopping a schedule fails', async () => {
			scheduleSynchronizedJob.mockReturnValueOnce({
				stop: vi.fn().mockRejectedValue(new Error('Failed to reset clock')),
			});

			const manager = await initializeWith([createFlow('schedule-flow', 'schedule', { cron: '* * * * *' })]);

			readByQuery.mockResolvedValueOnce([createFlow('flow-b')]);
			await manager.reload();
			await flushPromises();

			expect(manager.getFlow('schedule-flow')).toBeUndefined();
			expect(manager.getFlow('flow-b')).toBeDefined();
		});

		test('should ignore empty messages', async () => {
			await initializeWith([createFlow('flow-a')]);

			await bus.publish('flows', null);
			await flushPromises();

			expect(readByQuery).toHaveBeenCalledTimes(1);
		});
	});

	describe('runWebhookFlow', () => {
		const ASYNC_FLOW_CASES = [
			{
				name: 'webhook',
				flow: createFlow('async-webhook-flow', 'webhook', { method: 'GET', async: true }),
				id: 'GET-async-webhook-flow',
				data: {},
				accountability: undefined,
			},
			{
				name: 'manual',
				flow: createFlow('async-manual-flow', 'manual', {
					async: true,
					collections: ['articles'],
					requireSelection: false,
				}),
				id: 'POST-async-manual-flow',
				data: { body: { collection: 'articles' } },
				accountability: { role: null, user: 'user-id', roles: [], admin: true, app: false, ip: null },
			},
		];

		test.each(ASYNC_FLOW_CASES)(
			'should not leave errors of async $name flows unhandled',
			async ({ flow, id, data, accountability }) => {
				const manager = await initializeWith([flow]);

				// Without a schema in the context, running the flow reads one, which fails like a saturated pool
				getSchema.mockRejectedValueOnce(new Error('Timeout acquiring a connection'));

				const run = manager.runWebhookFlow(id, data, { schema: undefined as any, accountability });

				await expect(run).resolves.toEqual(expect.objectContaining({ result: undefined }));

				// Lets an unhandled rejection surface and fail the run, as it would crash the process
				await flushPromises();

				expect(getSchema).toHaveBeenCalledTimes(2);
			},
		);

		describe('manual trigger authentication', () => {
			const REJECTED_CASES = [
				{
					name: 'public/unauthenticated accountability',
					accountability: { role: null, user: null, roles: [], admin: false, app: false, ip: null },
				},
				{ name: 'undefined accountability', accountability: undefined },
				{
					name: 'share-only accountability',
					accountability: { role: null, user: null, roles: [], admin: false, app: false, ip: null, share: 'share-id' },
				},
			];

			const ALLOWED_CASES = [
				{
					name: 'authenticated user accountability',
					accountability: { role: null, user: 'user-id', roles: [], admin: true, app: false, ip: null },
				},
				{
					name: 'authenticated role-only accountability',
					accountability: { role: 'role-id', user: null, roles: [], admin: true, app: false, ip: null },
				},
			];

			const runManualFlow = async (accountability: any) => {
				const manager = await initializeWith([
					createFlow('manual-flow', 'manual', { collections: ['articles'], requireSelection: false }),
				]);

				return manager.runWebhookFlow(
					'POST-manual-flow',
					{ body: { collection: 'articles' } },
					{ accountability, schema: {} as any },
				);
			};

			test.each(REJECTED_CASES)('should throw ForbiddenError for $name', async ({ accountability }) => {
				await expect(runManualFlow(accountability)).rejects.toMatchObject({ code: 'FORBIDDEN' });
			});

			test.each(ALLOWED_CASES)('should trigger the flow for $name', async ({ accountability }) => {
				await expect(runManualFlow(accountability)).resolves.toHaveProperty('result');
			});
		});
	});

	describe('getFlowManager', () => {
		test('should not leave a failed subscription to flow messages unhandled', async () => {
			// A plain function rather than a mock, as Vitest marks rejections returned by mocks as handled
			bus.subscribe = (() => Promise.reject(new Error('Connection is closed.'))) as any;

			getFlowManager();

			// Lets an unhandled rejection surface and fail the run, as it would crash the process
			await flushPromises();
		});
	});
});
