import { parseJSON } from '@directus/shared/utils';
import IORedis from 'ioredis';
import type { Redis } from 'ioredis';
import env from './env';
import { getConfigFromEnv } from './utils/get-config-from-env';
import { merge } from 'lodash';

export type MessengerSubscriptionCallback = (payload: Record<string, any>) => void;

export interface Messenger {
	publish: (channel: string, payload: Record<string, any>) => void;
	subscribe: (channel: string, callback: MessengerSubscriptionCallback) => void;
	unsubscribe: (channel: string) => void;
}

export class MessengerMemory implements Messenger {
	handlers: Record<string, MessengerSubscriptionCallback>;

	constructor() {
		this.handlers = {};
	}

	publish(channel: string, payload: Record<string, any>) {
		this.handlers[channel]?.(payload);
	}

	subscribe(channel: string, callback: MessengerSubscriptionCallback) {
		this.handlers[channel] = callback;
	}

	unsubscribe(channel: string) {
		delete this.handlers[channel];
	}
}

export class MessengerRedis implements Messenger {
	namespace: string;
	pub: Redis;
	sub: Redis;

	constructor() {
		const config = this.getConfig();
		this.pub = new IORedis(config);
		this.sub = new IORedis(config);
		this.namespace = env.MESSENGER_NAMESPACE ?? 'directus';
	}

	private getConfig() {
		if ('MESSENGER_REDIS' in env) return env.MESSENGER_REDIS;
		return merge({}, getConfigFromEnv('REDIS_'), getConfigFromEnv('MESSENGER_REDIS'));
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

	if (env['MESSENGER_STORE'] === 'redis') {
		messenger = new MessengerRedis();
	} else {
		messenger = new MessengerMemory();
	}

	return messenger;
}
