import type { Accountability, SchemaOverview } from '@directus/types';
import { getService } from '../../utils/get-service.js';
import { CollectionsService, FieldsService, MetaService } from '../../services/index.js';
import type { WebSocketEvent } from '../messages.js';
import type { Subscription } from '../types.js';

type PSubscription = Omit<Subscription, 'client'>;

/**
 * Get items from a collection using the appropriate service
 *
 * @param subscription Subscription object
 * @param accountability Accountability object
 * @param schema Schema object
 * @param event Event data
 * @returns the fetched items
 */
export async function getPayload(
	subscription: PSubscription,
	accountability: Accountability | null,
	schema: SchemaOverview,
	event?: WebSocketEvent
): Promise<Record<string, any>> {
	const metaService = new MetaService({ schema, accountability });

	const result: Record<string, any> = {
		event: event?.action ?? 'init',
	};

	switch (subscription.collection) {
		case 'directus_collections':
			result['data'] = await getCollectionPayload(subscription, accountability, schema, event);
			break;
		case 'directus_fields':
			result['data'] = await getFieldsPayload(subscription, accountability, schema, event);
			break;
		case 'directus_relations':
			result['data'] = event?.payload;
			break;
		default:
			result['data'] = await getItemsPayload(subscription, accountability, schema, event);
			break;
	}

	const query = subscription.query ?? {};

	if ('meta' in query) {
		result['meta'] = await metaService.getMetaForQuery(subscription.collection, query);
	}

	return result;
}

/**
 * Get collection items
 *
 * @param accountability Accountability object
 * @param schema Schema object
 * @param event Event data
 * @returns the fetched collection data
 */
export async function getCollectionPayload(
	subscription: PSubscription,
	accountability: Accountability | null,
	schema: SchemaOverview,
	event?: WebSocketEvent
) {
	const service = new CollectionsService({ schema, accountability });

	if ('item' in subscription) {
		if (event?.action === 'delete') {
			// return only the subscribed id in case a bulk delete was done
			return subscription.item;
		} else {
			return await service.readOne(String(subscription.item));
		}
	}

	switch (event?.action) {
		case 'create':
			return await service.readMany([String(event.key)]);
		case 'update':
			return await service.readMany(event.keys.map((key: any) => String(key)));
		case 'delete':
			return event.keys;
		case undefined:
		default:
			return await service.readByQuery();
	}
}

/**
 * Get fields items
 *
 * @param accountability Accountability object
 * @param schema Schema object
 * @param event Event data
 * @returns the fetched field data
 */
export async function getFieldsPayload(
	subscription: PSubscription,
	accountability: Accountability | null,
	schema: SchemaOverview,
	event?: WebSocketEvent
) {
	const service = new FieldsService({ schema, accountability });

	if ('item' in subscription) {
		if (event?.action === 'delete') {
			// return only the subscribed id in case a bluk delete was done
			return subscription.item;
		} else {
			return await service.readOne(subscription.collection, String(subscription.item));
		}
	}

	switch (event?.action) {
		case undefined:
			return await service.readAll();
		case 'delete':
			return event.keys;
		default:
			return await service.readOne(event?.payload?.['collection'], event?.payload?.['field']);
	}
}

/**
 * Get items from a collection using the appropriate service
 *
 * @param subscription Subscription object
 * @param accountability Accountability object
 * @param schema Schema object
 * @param event Event data
 * @returns the fetched data
 */
export async function getItemsPayload(
	subscription: PSubscription,
	accountability: Accountability | null,
	schema: SchemaOverview,
	event?: WebSocketEvent
) {
	const query = subscription.query ?? {};
	const service = getService(subscription.collection, { schema, accountability });

	if ('item' in subscription) {
		if (event?.action === 'delete') {
			// return only the subscribed id in case a bluk delete was done
			return subscription.item;
		} else {
			return await service.readOne(subscription.item, query);
		}
	}

	switch (event?.action) {
		case 'create':
			return await service.readMany([event.key], query);
		case 'update':
			return await service.readMany(event.keys, query);
		case 'delete':
			return event.keys;
		case undefined:
		default:
			return await service.readByQuery(query);
	}
}
