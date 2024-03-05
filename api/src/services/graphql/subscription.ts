import { useBus } from '../../bus/index.js';
import type { GraphQLService } from './index.js';
import { getSchema } from '../../utils/get-schema.js';
import type { GraphQLResolveInfo, SelectionNode } from 'graphql';
import { refreshAccountability } from '../../websocket/authenticate.js';
import { getPayload } from '../../websocket/utils/items.js';
import type { Subscription } from '../../websocket/types.js';
import type { WebSocketEvent } from '../../websocket/messages.js';

class DeferredSubscription<T = Record<string, any>> {
	public active: boolean = true;
	public promise: Promise<T>;

	private resolver: ((value: T) => void) | null = null;

	constructor() {
		this.promise = new Promise((res) => (this.resolver = res));
		this.promise.then(() => (this.active = false));
	}

	reset() {
		this.active = true;
		this.resolver = null;
		this.promise = new Promise((res) => (this.resolver = res));
		this.promise.then(() => (this.active = false));
	}

	resolve(value: T) {
		if (this.resolver) this.resolver(value);
	}
}

class SubscriptionGenerator {
	deferred: Set<DeferredSubscription> = new Set([]);

	[Symbol.asyncIterator]() {
		const deferred = new DeferredSubscription();
		this.deferred.add(deferred);
		return {
			next: async () => {
				const value = await deferred.promise;
				deferred.reset();

				return { value, done: false };
			},
		};
	}

	async *subscribe(collection: string) {
		for await (const msg of this) {
			if (msg['collection'] === collection) {
				yield msg;
			}
		}
	}

	publish(message: Record<string, any>) {
		this.deferred.forEach((deferred) => {
			if (deferred.active) {
				deferred.resolve(message);
			} else {
				this.deferred.delete(deferred);
			}
		});
	}
}

const messageGenerator = new SubscriptionGenerator();

export function bindPubSub() {
	const messenger = useBus();

	messenger.subscribe('websocket.event', (message: Record<string, any>) => {
		messageGenerator.publish(message);
	});
}

export function createSubscriptionGenerator(self: GraphQLService, collection: string) {
	return async function* (_x: unknown, _y: unknown, _z: unknown, request: GraphQLResolveInfo) {
		const event = collection + '_mutated';
		const fields = parseFields(self, request);
		const args = parseArguments(request);
		const messages = messageGenerator.subscribe(collection);

		for await (const payload of messages) {
			const eventData = payload as WebSocketEvent;

			if ('event' in args && eventData['action'] !== args['event']) {
				continue; // skip filtered events
			}

			const accountability = await refreshAccountability(self.accountability);
			const schema = await getSchema();

			const subscription: Omit<Subscription, 'client'> = {
				collection: eventData['collection'],
				event: eventData['action'],
				query: { fields },
			};

			if (eventData['action'] === 'delete') {
				// we have no data to send besides the key
				for (const key of eventData.keys) {
					yield { [event]: { key, data: null, event: eventData['action'] } };
				}
			}

			if (eventData['action'] === 'create') {
				try {
					subscription.item = eventData['key'];
					const result = await getPayload(subscription, accountability, schema, eventData);

					yield {
						[event]: {
							key: eventData['key'],
							data: result['data'],
							event: eventData['action'],
						},
					};
				} catch {
					// dont notify the subscription of permission errors
				}
			}

			if (eventData['action'] === 'update') {
				for (const key of eventData['keys']) {
					try {
						subscription.item = key;
						const result = await getPayload(subscription, accountability, schema, eventData);

						yield {
							[event]: {
								key,
								data: result['data'],
								event: eventData['action'],
							},
						};
					} catch {
						// dont notify the subscription of permission errors
					}
				}
			}
		}
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
	return args.reduce(
		(result, current) => {
			if ('value' in current.value && typeof current.value.value === 'string') {
				result[current.name.value] = current.value.value;
			}

			return result;
		},
		{} as Record<string, string>,
	);
}
