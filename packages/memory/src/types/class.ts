export type MessageHandler = <T = unknown>(payload: T) => void

export interface Memory {
	/**
	 * Get the cached value by key. Returns undefined if the key doesn't exist in the cache
	 *
	 * @param key Key to retrieve from the cache
	 * @returns Cached value, or undefined if key doesn't exist
	 */
	get<T = unknown>(key: string): Promise<T | undefined>;

	/**
	 * Save the given value to the cache
	 *
	 * @param key Key to save in the cache
	 * @param value Value to save to the cache. Can be any JavaScript primitive, plain object, or array
	 */
	set<T = unknown>(key: string, value: T): Promise<void>;

	/**
	 * Increment the given cached value by the given amount
	 *
	 * @param key Key to increment in the cache
	 * @param [amount=1] Amount to increment. Defaults to 1
	 */
	increment(key: string, amount: number): Promise<void>;

	/**
	 * Remove the given key from the cache
	 *
	 * @param key Key to remove from the cache
	 */
	delete(key: string): Promise<void>;

	/**
	 * Publish a message to subscribed clients in the given channel
	 *
	 * @param channel Channel to publish to
	 * @param payload Value to send to the subscribed clients
	 */
	publish<T = unknown>(channel: string, payload: T): Promise<void>;

	/**
	 * Subscribe to messages in the given channel
	 *
	 * @param channel Channel to subscribe to
	 * @param payload Payload that was published to the given channel
	 */
	subscribe(channel: string, callback: MessageHandler): Promise<void>;

	/**
	 * Unsubscribe from a channel
	 *
	 * @param channel Channel to unsubscribe from
	 * @param callback Callback to remove from the stack
	 */
	unsubscribe(channel: string, callback: MessageHandler): Promise<void>;
}
