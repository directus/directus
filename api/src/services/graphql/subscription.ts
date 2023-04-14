import { EventEmitter, on } from 'events';
import { getMessenger } from '../../messenger.js';
import type { GraphQLService } from './index.js';
import { getSchema } from '../../utils/get-schema.js';
import { ItemsService } from '../items.js';
import type { Query } from '@directus/types';

const messages = createPubSub(new EventEmitter());

export function bindPubSub() {
	const messenger = getMessenger();

	messenger.subscribe('websocket.event', (message: Record<string, any>) => {
		messages.publish(`${message['collection']}_mutated`, message);
	});
}

export function createSubscriptionGenerator(self: GraphQLService, event: string) {
	return async function* (_x: unknown, _y: unknown, _z: unknown, request: any) {
		const selections = request.fieldNodes[0]?.selectionSet?.selections || [];
		const { fields } = self.getQuery({}, selections, {});

		for await (const payload of messages.subscribe(event)) {
			const eventData = payload as Record<string, any>;
			const schema = await getSchema();

			if (eventData['action'] === 'create') {
				const { collection, key } = eventData;
				const service = new ItemsService(collection, { schema });
				const data = await service.readOne(key, { fields } as Query);
				yield { [event]: { ...data, _event: 'create' } };
			}

			if (eventData['action'] === 'update') {
				const { collection, keys } = eventData;
				const service = new ItemsService(collection, { schema });

				for (const key of keys) {
					const data = await service.readOne(key, { fields } as Query);
					yield { [event]: { ...data, _event: 'update' } };
				}
			}

			if (eventData['action'] === 'delete') {
				const { keys } = eventData;

				for (const key of keys) {
					const result: Record<string, any> = {};

					if (fields) {
						for (const field of fields) {
							result[field] = null;
						}
					}

					const pk = schema.collections[eventData['collection']]?.primary;
					if (pk) result[pk] = key;
					result['_event'] = 'delete';
					yield { [event]: result };
				}
			}
		}
	};
}

function createPubSub<P extends { [key: string]: unknown }>(emitter: EventEmitter) {
	return {
		publish: <T extends Extract<keyof P, string>>(event: T, payload: P[T]) =>
			void emitter.emit(event as string, payload),
		subscribe: async function* <T extends Extract<keyof P, string>>(event: T): AsyncIterableIterator<P[T]> {
			const asyncIterator = on(emitter, event);

			for await (const [value] of asyncIterator) {
				yield value;
			}
		},
	};
}
