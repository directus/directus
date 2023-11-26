import type { Bus, MessageHandler } from '../types/class.js';
import type { BusConfigLocal } from '../types/config.js';

export class BusLocal implements Bus {
	private handlers: Record<string, Set<MessageHandler>>;

	constructor(_config: Omit<BusConfigLocal, 'type'>) {
		this.handlers = {};
	}

	async publish<T = unknown>(channel: string, payload: T) {
		this.handlers[channel]?.forEach((callback) => callback(payload));
	}

	async subscribe(channel: string, callback: MessageHandler) {
		const set = this.handlers[channel] ?? new Set();

		set.add(callback);

		this.handlers[channel] = set;
	}

	async unsubscribe(channel: string, callback: MessageHandler) {
		this.handlers[channel]?.delete(callback);
	}
}
