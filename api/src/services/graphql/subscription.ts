import { EventEmitter, on } from 'events';
import type { Query } from '@directus/shared/types';
import { ItemsService } from '../items';
import emitter from '../../emitter';
import { getSchema } from '../../utils/get-schema';
import type { GraphQLService } from './index';

export const createPubSub = <P extends { [key: string]: unknown }>(emitter: EventEmitter) => {
	return {
		publish: <T extends Extract<keyof P, string>>(topic: T, payload: P[T]) =>
			void emitter.emit(topic as string, payload),
		subscribe: async function* <T extends Extract<keyof P, string>>(topic: T): AsyncIterableIterator<P[T]> {
			const asyncIterator = on(emitter, topic);
			for await (const [value] of asyncIterator) {
				yield value;
			}
		},
	};
};

export const messages = createPubSub(new EventEmitter());

// for now only the items will be watched in the MVP system events tbd
[
	'items' /*, 'activity', 'collections', 'fields', 'folders', 'permissions',
	'presets', 'relations', 'revisions', 'roles', 'settings', 'users', 'webhooks'*/,
].forEach((collectionName) => {
	emitter.onAction(collectionName + '.create', async ({ collection, key, payload }) => {
		const eventName = `${collection}_mutated`.toUpperCase();
		messages.publish(eventName, { action: 'created', collection, key, payload });
	});
	emitter.onAction(collectionName + '.update', async ({ collection, keys, payload }) => {
		const eventName = `${collection}_mutated`.toUpperCase();
		messages.publish(eventName, { action: 'updated', collection, keys, payload });
	});
	emitter.onAction(collectionName + '.delete', (ctx) => {
		const { collection, keys } = ctx;
		const eventName = `${collection}_mutated`.toUpperCase();
		messages.publish(eventName, { action: 'deleted', collection, keys });
	});
});

export function createSubscriptionGenerator(self: GraphQLService, event: string, name: string) {
	return async function* (_x: unknown, _y: unknown, _z: unknown, request: any) {
		const selections = request.fieldNodes[0]?.selectionSet?.selections || [];
		const { fields } = self.getQuery({}, selections, {});
		for await (const payload of messages.subscribe(event)) {
			const eventData = payload as Record<string, any>;
			const schema = await getSchema();
			if (eventData.action === 'created') {
				const { collection, key } = eventData;
				const service = new ItemsService(collection, { schema });
				const data = await service.readOne(key, { fields } as Query);
				yield { [name]: { ...data, event: 'created' } };
			}
			if (eventData.action === 'updated') {
				const { collection, keys } = eventData;
				const service = new ItemsService(collection, { schema });
				for (const key of keys) {
					const data = await service.readOne(key, { fields } as Query);
					yield { [name]: { ...data, event: 'updated' } };
				}
			}
			if (eventData.action === 'deleted') {
				const { keys } = eventData;

				for (const key of keys) {
					const result: Record<string, any> = {};
					if (fields) {
						for (const field of fields) {
							result[field] = null;
						}
					}
					const pk = schema.collections[eventData.collection]?.primary;
					result[pk] = key;
					result.event = 'deleted';
					yield { [name]: result };
				}
			}
		}
	};
}
