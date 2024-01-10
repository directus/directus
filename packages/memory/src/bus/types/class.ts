export type MessageHandler<T = unknown> = (payload: T) => void;

export interface Bus {
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
	 * @param callback Payload that was published to the given channel
	 */
	subscribe<T = unknown>(channel: string, callback: MessageHandler<T>): Promise<void>;

	/**
	 * Unsubscribe from a channel
	 *
	 * @param channel Channel to unsubscribe from
	 * @param callback Callback to remove from the stack
	 */
	unsubscribe(channel: string, callback: MessageHandler): Promise<void>;
}
