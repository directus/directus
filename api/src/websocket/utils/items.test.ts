import type { Accountability, SchemaOverview } from '@directus/types';
import { describe, expect, test, vi } from 'vitest';
import type { WebSocketEvent } from '../messages.js';
import { getCollectionPayload } from './items.js';

vi.mock('../../services/index.js', async () => {
	const { mockItemsService } = await import('../../test-utils/services/items-service.js');
	const { ItemsService } = mockItemsService();

	return { CollectionsService: ItemsService, FieldsService: vi.fn(), MetaService: vi.fn() };
});

const accountability = {
	role: null,
	user: 'a5e0e0b0-0000-4000-8000-000000000000',
	roles: [],
	admin: false,
	app: true,
	ip: null,
} satisfies Accountability;

const schema = { collections: {}, relations: [] } as unknown as SchemaOverview;

const deleteEvent: WebSocketEvent = {
	action: 'delete',
	collection: 'directus_collections',
	keys: ['articles', 'secrets'],
};

describe('getCollectionPayload delete events', () => {
	test('returns nothing for non-admins', async () => {
		const result = await getCollectionPayload(
			{ collection: 'directus_collections', event: 'delete' },
			accountability,
			schema,
			deleteEvent,
		);

		// an empty array is not dispatched to the subscriber
		expect(result).toEqual([]);
	});

	test('returns nothing for item scoped subscriptions of non-admins', async () => {
		const result = await getCollectionPayload(
			{ collection: 'directus_collections', event: 'delete', item: 'articles' },
			accountability,
			schema,
			deleteEvent,
		);

		expect(result).toEqual([]);
	});

	test('returns every deleted collection for admins', async () => {
		const result = await getCollectionPayload(
			{ collection: 'directus_collections', event: 'delete' },
			{ ...accountability, admin: true },
			schema,
			deleteEvent,
		);

		expect(result).toEqual(['articles', 'secrets']);
	});

	test('returns the subscribed collection for item scoped subscriptions of admins', async () => {
		const result = await getCollectionPayload(
			{ collection: 'directus_collections', event: 'delete', item: 'articles' },
			{ ...accountability, admin: true },
			schema,
			deleteEvent,
		);

		expect(result).toBe('articles');
	});

	test('returns every deleted collection when access control is disabled', async () => {
		const result = await getCollectionPayload(
			{ collection: 'directus_collections', event: 'delete' },
			null,
			schema,
			deleteEvent,
		);

		expect(result).toEqual(['articles', 'secrets']);
	});
});
