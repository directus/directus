import { ForbiddenError, InvalidPayloadError } from '@directus/errors';
import type { Accountability, SchemaOverview } from '@directus/types';
import { fetchAllowedFields } from '../../permissions/modules/fetch-allowed-fields/fetch-allowed-fields.js';
import { CollectionsService, FieldsService, MetaService, RelationsService } from '../../services/index.js';
import { getService } from '../../utils/get-service.js';
import { isAdmin } from '../../utils/is-admin.js';
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
	event?: WebSocketEvent,
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
			result['data'] = await getRelationsPayload(accountability, schema, event);
			break;
		case 'directus_extensions':
			throw new InvalidPayloadError({ reason: '"directus_extensions" is currently not supported.' });
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
	event?: WebSocketEvent,
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
	event?: WebSocketEvent,
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
 * Get relations through the RelationsService, which only returns relations on collections and fields the
 * accountability can read
 *
 * @param accountability Accountability object
 * @param schema Schema object
 * @param event Event data
 * @returns the fetched relation data
 */
export async function getRelationsPayload(
	accountability: Accountability | null,
	schema: SchemaOverview,
	event?: WebSocketEvent,
) {
	const service = new RelationsService({ schema, accountability });

	if (event?.action === 'create' || event?.action === 'update') {
		// relation events are keyed by the id of their directus_relations row
		const keys = (event.action === 'create' ? [event.key] : event.keys).map(String);
		const relations = await service.readAll();

		return relations.filter((relation) => relation.meta && keys.includes(String(relation.meta.id)));
	}

	if (event?.action === 'delete') {
		const { collection, fields = [] } = event.payload ?? {};

		// the relation no longer exists, so validate read access to the fields it was defined on instead
		if (!isAdmin(accountability)) {
			const allowedFields = await fetchAllowedFields(
				{ collection, action: 'read', accountability },
				{ schema, knex: service.knex },
			);

			if (!allowedFields.includes('*') && !fields.every((field: string) => allowedFields.includes(field))) {
				throw new ForbiddenError();
			}
		}

		return event.payload;
	}

	return await service.readAll();
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
	event?: WebSocketEvent,
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
