import type { Accountability, SchemaOverview } from '@directus/types';
import { getService } from '../../utils/get-service.js';
import { CollectionsService, FieldsService, MetaService } from '../../services/index.js';
import type { WebSocketEvent } from '../messages.js';
import type { Subscription } from '../types.js';

type PSubscription = Omit<Subscription, 'client'>;

/**
 * 
 * @param subscription 
 * @param accountability 
 * @param schema 
 * @param event 
 * @returns 
 */
export async function getSinglePayload(
    subscription: PSubscription,
    accountability: Accountability | null,
    schema: SchemaOverview,
    event?: WebSocketEvent
): Promise<Record<string, any>> {
    const metaService = new MetaService({ schema, accountability });
    const query = subscription.query ?? {};
    const id = subscription.item!;

    const result: Record<string, any> = {
        event: event?.action ?? 'init',
    };

    if (subscription.collection === 'directus_collections') {
        const service = new CollectionsService({ schema, accountability });
        result['data'] = await service.readOne(String(id));
    } else {
        const service = getService(subscription.collection, { schema, accountability });
        result['data'] = await service.readOne(id, query);
    }

    if ('meta' in query) {
        result['meta'] = await metaService.getMetaForQuery(subscription.collection, query);
    }

    return result;
}

/**
 * 
 * @param subscription 
 * @param accountability 
 * @param schema 
 * @param event 
 * @returns 
 */
export async function getMultiPayload(
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
            result['data'] = await getCollectionPayload(accountability, schema, event);
            break;
        case 'directus_fields':
            result['data'] = await getFieldsPayload(accountability, schema, event);
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
 * 
 * @param accountability 
 * @param schema 
 * @param event 
 * @returns 
 */
export async function getCollectionPayload(
    accountability: Accountability | null,
    schema: SchemaOverview,
    event?: WebSocketEvent
) {
    const service = new CollectionsService({ schema, accountability });

    if (!event?.action) {
        return await service.readByQuery();
    } else if (event.action === 'create') {
        return await service.readMany([String(event.key)]);
    } else if (event.action === 'delete') {
        return event.keys;
    } else {
        return await service.readMany(event.keys.map((key: any) => String(key)));
    }
}

/**
 * 
 * @param accountability 
 * @param schema 
 * @param event 
 * @returns 
 */
export async function getFieldsPayload(
    accountability: Accountability | null,
    schema: SchemaOverview,
    event?: WebSocketEvent
) {
    const service = new FieldsService({ schema, accountability });

    if (!event?.action) {
        return await service.readAll();
    } else if (event.action === 'delete') {
        return event.keys;
    } else {
        return await service.readOne(event.payload?.['collection'], event.payload?.['field']);
    }
}

/**
 * 
 * @param subscription 
 * @param accountability 
 * @param schema 
 * @param event 
 * @returns 
 */
export async function getItemsPayload(
    subscription: PSubscription,
    accountability: Accountability | null,
    schema: SchemaOverview,
    event?: WebSocketEvent
) {
    const query = subscription.query ?? {};
    const service = getService(subscription.collection, { schema, accountability });

    if (!event?.action) {
        return await service.readByQuery(query);
    } else if (event.action === 'create') {
        return await service.readMany([event.key], query);
    } else if (event.action === 'delete') {
        return event.keys;
    } else {
        return await service.readMany(event.keys, query);
    }
}