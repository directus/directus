import { parseJSON } from '@directus/utils';
import { Redis } from 'ioredis';
import { useEnv } from './env.js';
import { getConfigFromEnv } from './utils/get-config-from-env.js';

export type MessengerSubscriptionCallback = (payload: Record<string, any>) => void;

export interface Messenger {
	publish: (channel: string, payload: Record<string, any>) => void;
	subscribe: (channel: string, callback: MessengerSubscriptionCallback) => void;
	unsubscribe: (channel: string, callback?: MessengerSubscriptionCallback) => void;
}

export class MessengerMemory implements Messenger {
	handlers: Record<string, Set<MessengerSubscriptionCallback>>;

	constructor() {
		this.handlers = {};
	}

	publish(channel: string, payload: Record<string, any>) {
		this.handlers[channel]?.forEach((callback) => callback(payload));
	}

	subscribe(channel: string, callback: MessengerSubscriptionCallback) {
		if (!this.handlers[channel]) this.handlers[channel] = new Set();
		this.handlers[channel]?.add(callback);
	}

	unsubscribe(channel: string, callback?: MessengerSubscriptionCallback) {
		if (!callback) {
			delete this.handlers[channel];
		} else {
			this.handlers[channel]?.delete(callback);
		}
	}
}

export class MessengerRedis implements Messenger {
	namespace: string;
	pub: Redis;
	sub: Redis;

	constructor() {
		const env = useEnv();

		const config = getConfigFromEnv('REDIS');
		this.pub = new Redis(env['REDIS'] ?? config);
		this.sub = new Redis(env['REDIS'] ?? config);
		this.namespace = env['MESSENGER_NAMESPACE'] ?? 'directus-messenger';
	}

	publish(channel: string, payload: Record<string, any>) {
		this.pub.publish(`${this.namespace}:${channel}`, JSON.stringify(payload));
	}

	subscribe(channel: string, callback: MessengerSubscriptionCallback) {
		this.sub.subscribe(`${this.namespace}:${channel}`);

		this.sub.on('message', (messageChannel: string, payloadString: string) => {
			const payload = parseJSON(payloadString);

			if (messageChannel === `${this.namespace}:${channel}`) {
				callback(payload);
			}
		});
	}

	unsubscribe(channel: string) {
		this.sub.unsubscribe(`${this.namespace}:${channel}`);
	}
}

let messenger: Messenger;

export function getMessenger() {
	if (messenger) return messenger;

	const env = useEnv();

	if (env['MESSENGER_STORE'] === 'redis') {
		messenger = new MessengerRedis();
	} else {
		messenger = new MessengerMemory();
	}

	return messenger;
}
