export type MessengerSubscriptionCallback = (payload: Record<string, any>) => void;

export interface Messenger {
	publish: (channel: string, payload: Record<string, any>) => void;
	subscribe: (channel: string, callback: MessengerSubscriptionCallback) => void;
	unsubscribe: (channel: string) => void;
}
