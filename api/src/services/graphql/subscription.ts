import { EventEmitter, on } from 'events';
import type { Query } from '@directus/shared/types';
import { ItemsService } from '../items.js';
import emitter from '../../emitter.js';
import { getSchema } from '../../utils/get-schema.js';
import type { GraphQLService } from './index.js';

export const createPubSub = <TTopicPayload extends { [key: string]: unknown }>(emitter: EventEmitter) => {
	return {
		publish: <TTopic extends Extract<keyof TTopicPayload, string>>(topic: TTopic, payload: TTopicPayload[TTopic]) =>
			void emitter.emit(topic as string, payload),
		subscribe: async function* <TTopic extends Extract<keyof TTopicPayload, string>>(
			topic: TTopic
		): AsyncIterableIterator<TTopicPayload[TTopic]> {
			const asyncIterator = on(emitter, topic);
			for await (const [value] of asyncIterator) {
				yield value;
			}
		},
	};
};

export const messages = createPubSub(new EventEmitter());

[
	'items' /*, 'activity', 'collections', 'fields', 'folders', 'permissions',
	'presets', 'relations', 'revisions', 'roles', 'settings', 'users', 'webhooks'*/,
].forEach((collectionName) => {
	emitter.onAction(collectionName + '.create', async ({ collection, key, payload }) => {
		const eventName = `${collection}_created`.toUpperCase();
		messages.publish(eventName, { collection, key, payload });
	});
	emitter.onAction(collectionName + '.update', async ({ collection, keys, payload }) => {
		const eventName = `${collection}_updated`.toUpperCase();
		messages.publish(eventName, { collection, keys, payload });
	});
	emitter.onAction(collectionName + '.delete', ({ collection, keys }) => {
		const eventName = `${collection}_deleted`.toUpperCase();
		messages.publish(eventName, { keys });
	});
});

export function createSubscriptionGenerator(
	self: GraphQLService,
	action: 'created' | 'updated' | 'deleted',
	event: string,
	name: string
) {
	return async function* (_x: unknown, _y: unknown, _z: unknown, request: any) {
		const selections = request.fieldNodes[0]?.selectionSet?.selections || [];
		const { fields } = self.getQuery({}, selections, {});
		for await (const payload of messages.subscribe(event)) {
			if (action === 'created') {
				const { collection, key } = payload as any;
				const s = new ItemsService(collection, { schema: await getSchema() });
				yield { [name]: await s.readOne(key, { fields } as Query) };
			}
			if (action === 'updated') {
				const { collection, keys } = payload as any;
				const s = new ItemsService(collection, { schema: await getSchema() });
				yield { [name]: await s.readMany(keys, { fields } as Query) };
			}
			if (action === 'deleted') {
				const { keys } = payload as any;
				yield { [name]: keys };
			}
		}
	};
}
