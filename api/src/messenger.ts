import IORedis from 'ioredis';
import { getConfigFromEnv } from './utils/get-config-from-env';
import { parseJSON } from './utils/parse-json';
import env from './env';
import { nanoid } from 'nanoid';

type MessengerSubscriptionCallback = (payload: Record<string, any>) => void;

export interface Messenger {
	publish: (channel: string, payload: Record<string, any>) => void;
	subscribe: (channel: string, callback: MessengerSubscriptionCallback) => void;
	unsubscribe: (channel: string) => void;
}

export class MessengerRedis implements Messenger {
	id: string;
	namespace: string;
	pub: IORedis.Redis;
	sub: IORedis.Redis;

	constructor() {
		const config = getConfigFromEnv('MESSENGER_REDIS');
		this.id = nanoid();
		this.pub = new IORedis(env.MESSENGER_REDIS ?? config);
		this.sub = new IORedis(env.MESSENGER_REDIS ?? config);
		this.namespace = env.MESSENGER_NAMESPACE ?? 'directus';
	}

	publish(channel: string, payload: Record<string, any>) {
		this.pub.publish(
			`${this.namespace}:${channel}`,
			JSON.stringify({
				_hostID: this.id,
				...payload,
			})
		);
	}

	subscribe(channel: string, callback: MessengerSubscriptionCallback) {
		this.sub.subscribe(`${this.namespace}:${channel}`);

		this.sub.on('message', (messageChannel, payloadString) => {
			const payload = parseJSON(payloadString);

			if (messageChannel === `${this.namespace}:${channel}` && payload._hostID !== this.id) {
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

	if (env.MESSENGER_STORE === 'redis') {
		messenger = new MessengerRedis();
	} else {
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		messenger = { publish: () => {}, subscribe: () => {}, unsubscribe: () => {} };
	}

	return messenger;
}
