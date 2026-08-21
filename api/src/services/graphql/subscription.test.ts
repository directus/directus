import { ForbiddenError } from '@directus/errors';
import type { Accountability, SchemaOverview } from '@directus/types';
import type { GraphQLResolveInfo } from 'graphql';
import type { Knex } from 'knex';
import { afterEach, beforeAll, expect, test, vi } from 'vitest';
import { useBus } from '../../bus/index.js';
import { getSchema } from '../../utils/get-schema.js';
import { getPayload } from '../../websocket/utils/items.js';
import { validateSubscriptionAccess } from '../../websocket/utils/validate-subscription-access.js';
import { getQuery } from './schema/parse-query.js';
import { bindPubSub, createSubscriptionGenerator } from './subscription.js';
import type { GraphQLService } from './index.js';

vi.mock('../../bus/index.js', () => ({ useBus: vi.fn() }));
vi.mock('../../utils/get-schema.js', () => ({ getSchema: vi.fn() }));
vi.mock('./schema/parse-query.js', () => ({ getQuery: vi.fn() }));
vi.mock('../../websocket/utils/items.js', () => ({ getPayload: vi.fn() }));

vi.mock('../../websocket/utils/validate-subscription-access.js', () => ({
	validateSubscriptionAccess: vi.fn(),
}));

const EVENT = 'articles_mutated';

const accountability = {
	role: null,
	user: 'a5e0e0b0-0000-4000-8000-000000000000',
	roles: [],
	admin: false,
	app: false,
	ip: null,
} satisfies Accountability;

const gql = {
	accountability,
	knex: {} as Knex,
	schema: {} as SchemaOverview,
} as GraphQLService;

const request = {
	fieldNodes: [{ selectionSet: { selections: [] }, arguments: [] }],
	variableValues: {},
} as unknown as GraphQLResolveInfo;

/** Push an event onto the bus the subscriptions listen on */
let publish: (event: Record<string, any>) => void;

beforeAll(() => {
	vi.mocked(useBus).mockReturnValue({
		subscribe: (_channel: string, callback: (message: any) => void) => {
			publish = callback;
		},
	} as unknown as ReturnType<typeof useBus>);

	vi.mocked(getSchema).mockResolvedValue({} as SchemaOverview);
	vi.mocked(getQuery).mockResolvedValue({ fields: ['*'] } as any);

	bindPubSub();
});

afterEach(() => {
	vi.mocked(validateSubscriptionAccess).mockReset();
	vi.mocked(getPayload).mockReset();
});

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Start a subscription and wait until it is listening, so events published afterwards are picked up
 */
async function subscribe() {
	const iterator = createSubscriptionGenerator(gql, EVENT)(null, null, null, request);
	const next = iterator.next();

	await sleep(10);

	return { iterator, next };
}

test('yields the keys of delete events when read access is allowed', async () => {
	const { iterator, next } = await subscribe();

	publish({ collection: 'articles', action: 'delete', keys: ['1'] });

	await expect(next).resolves.toEqual({
		done: false,
		value: { [EVENT]: { key: '1', data: null, event: 'delete' } },
	});

	expect(validateSubscriptionAccess).toBeCalledWith(
		{ accountability, collection: 'articles' },
		{ knex: gql.knex, schema: {} },
	);

	await iterator.return();
});

test('skips delete events when read access is denied', async () => {
	const { iterator, next } = await subscribe();

	vi.mocked(validateSubscriptionAccess).mockRejectedValueOnce(new ForbiddenError());

	// Regression for GHSA-f3mg-j7hc-hh45: the keys of deleted rows used to be yielded without any
	// permission check
	publish({ collection: 'articles', action: 'delete', keys: ['leaked'] });
	publish({ collection: 'articles', action: 'delete', keys: ['permitted'] });

	// The first event is dropped entirely, so the first yielded value belongs to the second event
	await expect(next).resolves.toEqual({
		done: false,
		value: { [EVENT]: { key: 'permitted', data: null, event: 'delete' } },
	});

	await iterator.return();
});

test('yields every key of a bulk delete', async () => {
	const { iterator, next } = await subscribe();

	publish({ collection: 'articles', action: 'delete', keys: ['1', '2'] });

	await expect(next).resolves.toMatchObject({ value: { [EVENT]: { key: '1' } } });
	await expect(iterator.next()).resolves.toMatchObject({ value: { [EVENT]: { key: '2' } } });

	await iterator.return();
});

test('reads create events through the permission aware payload read', async () => {
	const { iterator, next } = await subscribe();

	vi.mocked(getPayload).mockResolvedValue({ data: { id: '1', title: 'Hello' } });

	publish({ collection: 'articles', action: 'create', key: '1' });

	await expect(next).resolves.toEqual({
		done: false,
		value: { [EVENT]: { key: '1', data: { id: '1', title: 'Hello' }, event: 'create' } },
	});

	// The payload read enforces access control for create events, so no separate check is needed
	expect(validateSubscriptionAccess).not.toBeCalled();

	await iterator.return();
});
