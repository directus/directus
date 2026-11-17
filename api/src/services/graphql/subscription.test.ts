import { setImmediate } from 'node:timers/promises';
import { ForbiddenError, ServiceUnavailableError } from '@directus/errors';
import type { SchemaOverview } from '@directus/types';
import type { GraphQLResolveInfo } from 'graphql';
import type { Knex } from 'knex';
import { afterEach, beforeAll, expect, onTestFinished, test, vi } from 'vitest';
import { useBus } from '../../bus/index.js';
import { createDefaultAccountability } from '../../permissions/utils/create-default-accountability.js';
import { createMockBus } from '../../test-utils/bus.js';
import { getSchema } from '../../utils/get-schema.js';
import { getPayload } from '../../websocket/utils/items.js';
import { validateDeleteEventAccess } from '../../websocket/utils/validate-subscription-access.js';
import { getQuery } from './schema/parse-query.js';
import { bindPubSub, createSubscriptionGenerator } from './subscription.js';
import type { GraphQLService } from './index.js';

vi.mock('../../bus/index.js', () => ({ useBus: vi.fn() }));
vi.mock('../../utils/get-schema.js', () => ({ getSchema: vi.fn() }));
vi.mock('./schema/parse-query.js', () => ({ getQuery: vi.fn() }));
vi.mock('../../websocket/utils/items.js', () => ({ getPayload: vi.fn() }));

vi.mock('../../websocket/utils/validate-subscription-access.js', () => ({
	validateDeleteEventAccess: vi.fn(),
}));

const EVENT = 'articles_mutated';

const accountability = createDefaultAccountability({ user: 'a5e0e0b0-0000-4000-8000-000000000000' });

const gql = {
	accountability,
	knex: {} as Knex,
	schema: {} as SchemaOverview,
} as unknown as GraphQLService;

const request = {
	fieldNodes: [{ selectionSet: { selections: [] }, arguments: [] }],
	variableValues: {},
} as unknown as GraphQLResolveInfo;

const { bus } = createMockBus();

beforeAll(() => {
	vi.mocked(useBus).mockReturnValue(bus as unknown as ReturnType<typeof useBus>);
	vi.mocked(getSchema).mockResolvedValue({} as SchemaOverview);
	vi.mocked(getQuery).mockResolvedValue({ fields: ['*'] } as any);

	bindPubSub();
});

afterEach(() => {
	vi.mocked(validateDeleteEventAccess).mockReset();
	vi.mocked(getPayload).mockReset();
});

/** Start a subscription and wait until it is listening, so events published afterwards are picked up */
async function subscribe() {
	const iterator = createSubscriptionGenerator(gql, EVENT)(null, null, null, request);
	const next = iterator.next();

	onTestFinished(async () => {
		await iterator.return();
	});

	// The generator starts listening once its pending promises have settled
	await setImmediate();

	return { iterator, next };
}

test('yields the keys of delete events when read access is allowed', async () => {
	const { next } = await subscribe();

	await bus.publish('websocket.event', { collection: 'articles', action: 'delete', keys: ['1'] });

	await expect(next).resolves.toEqual({
		done: false,
		value: { [EVENT]: { key: '1', data: null, event: 'delete' } },
	});

	expect(validateDeleteEventAccess).toBeCalledWith(
		{ accountability, collection: 'articles', itemScoped: false },
		{ knex: gql.knex, schema: {} },
	);
});

test('skips delete events when the access check throws any error', async () => {
	const { next } = await subscribe();

	vi.mocked(validateDeleteEventAccess).mockRejectedValueOnce(
		new ServiceUnavailableError({ service: 'database', reason: 'down' }),
	);

	await bus.publish('websocket.event', { collection: 'articles', action: 'delete', keys: ['leaked'] });
	await bus.publish('websocket.event', { collection: 'articles', action: 'delete', keys: ['permitted'] });

	await expect(next).resolves.toEqual({
		done: false,
		value: { [EVENT]: { key: 'permitted', data: null, event: 'delete' } },
	});
});

test('yields every key of a bulk delete', async () => {
	const { iterator, next } = await subscribe();

	await bus.publish('websocket.event', { collection: 'articles', action: 'delete', keys: ['1', '2'] });

	await expect(next).resolves.toMatchObject({ value: { [EVENT]: { key: '1' } } });
	await expect(iterator.next()).resolves.toMatchObject({ value: { [EVENT]: { key: '2' } } });
});

test('reads create events through the permission aware payload read', async () => {
	const { next } = await subscribe();

	vi.mocked(getPayload).mockResolvedValue({ data: { id: '1', title: 'Hello' } });

	await bus.publish('websocket.event', { collection: 'articles', action: 'create', key: '1' });

	await expect(next).resolves.toEqual({
		done: false,
		value: { [EVENT]: { key: '1', data: { id: '1', title: 'Hello' }, event: 'create' } },
	});

	expect(getPayload).toBeCalledWith(
		expect.objectContaining({ item: '1' }),
		accountability,
		expect.anything(),
		expect.anything(),
	);
});

test('skips create events the subscriber cannot read', async () => {
	const { next } = await subscribe();

	vi.mocked(getPayload)
		.mockRejectedValueOnce(new ForbiddenError())
		.mockResolvedValueOnce({ data: { id: '2' } });

	await bus.publish('websocket.event', { collection: 'articles', action: 'create', key: '1' });
	await bus.publish('websocket.event', { collection: 'articles', action: 'create', key: '2' });

	await expect(next).resolves.toMatchObject({ value: { [EVENT]: { key: '2', data: { id: '2' } } } });
});

test('reads every key of an update event separately, skipping the keys the subscriber cannot read', async () => {
	const { iterator, next } = await subscribe();

	vi.mocked(getPayload).mockImplementation(async (subscription) => {
		if (subscription.item === '2') throw new ForbiddenError();
		return { data: { id: subscription.item } };
	});

	await bus.publish('websocket.event', { collection: 'articles', action: 'update', keys: ['1', '2', '3'] });

	await expect(next).resolves.toEqual({
		done: false,
		value: { [EVENT]: { key: '1', data: { id: '1' }, event: 'update' } },
	});

	await expect(iterator.next()).resolves.toEqual({
		done: false,
		value: { [EVENT]: { key: '3', data: { id: '3' }, event: 'update' } },
	});

	expect(vi.mocked(getPayload).mock.calls.map((call) => call[1])).toEqual([
		accountability,
		accountability,
		accountability,
	]);
});
