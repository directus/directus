import { EventEmitter, on } from 'events';
import { getMessenger } from '../../messenger.js';
import type { GraphQLService } from './index.js';
import { getSchema } from '../../utils/get-schema.js';
import { ItemsService } from '../items.js';
import type { Query } from '@directus/types';
import type { GraphQLResolveInfo, SelectionNode } from 'graphql';

const messages = createPubSub(new EventEmitter());

export function bindPubSub() {
	const messenger = getMessenger();

	messenger.subscribe('websocket.event', (message: Record<string, any>) => {
		messages.publish(`${message['collection']}_mutated`, message);
	});
}

export function createSubscriptionGenerator(self: GraphQLService, event: string) {
	return async function* (_x: unknown, _y: unknown, _z: unknown, request: GraphQLResolveInfo) {
		const fields = parseFields(self, request);
		const args = parseArguments(request);

		for await (const payload of messages.subscribe(event)) {
			const eventData = payload as Record<string, any>;

			if ('event' in args && eventData['action'] !== args['event']) {
				continue; // skip filtered events
			}

			const schema = await getSchema();

			if (eventData['action'] === 'create') {
				const { collection, key } = eventData;
				const service = new ItemsService(collection, { schema });
				const data = await service.readOne(key, { fields } as Query);
				yield { [event]: { key, data, event: 'create' } };
			}

			if (eventData['action'] === 'update') {
				const { collection, keys } = eventData;
				const service = new ItemsService(collection, { schema });

				for (const key of keys) {
					const data = await service.readOne(key, { fields } as Query);
					yield { [event]: { key, data, event: 'update' } };
				}
			}

			if (eventData['action'] === 'delete') {
				const { keys } = eventData;

				for (const key of keys) {
					yield { [event]: { key, data: null, event: 'delete' } };
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

function parseFields(service: GraphQLService, request: GraphQLResolveInfo) {
	const selections = request.fieldNodes[0]?.selectionSet?.selections ?? [];

	const dataSelections = selections.reduce((result: readonly SelectionNode[], selection: SelectionNode) => {
		if (
			selection.kind === 'Field' &&
			selection.name.value === 'data' &&
			selection.selectionSet?.kind === 'SelectionSet'
		) {
			return selection.selectionSet.selections;
		}

		return result;
	}, []);

	const { fields } = service.getQuery({}, dataSelections, request.variableValues);
	return fields ?? [];
}

function parseArguments(request: GraphQLResolveInfo) {
	const args = request.fieldNodes[0]?.arguments ?? [];
	return args.reduce((result, current) => {
		if ('value' in current.value && typeof current.value.value === 'string') {
			result[current.name.value] = current.value.value;
		}

		return result;
	}, {} as Record<string, string>);
}
