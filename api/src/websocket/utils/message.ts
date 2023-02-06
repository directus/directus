import type { WebSocketClient } from '../types';

/**
 * Message utils
 */
export const trimUpper = (str: string) => (str ?? '').trim().toUpperCase();

export const fmtMessage = (type: string, data: Record<string, any> = {}, uid?: string) => {
	const message: Record<string, any> = { type, ...data };
	if (uid !== undefined) {
		message['uid'] = uid;
	}
	return JSON.stringify(message);
};

// we may need this later for slow connections
export const safeSend = async (client: WebSocketClient, data: string, delay = 100) => {
	if (client.readyState !== client.OPEN) return;
	if (client.bufferedAmount > 0) {
		// wait for the buffer to clear
		return new Promise((resolve) => {
			setTimeout(() => {
				safeSend(client, data, delay).finally(() => resolve(null));
			}, delay);
		});
	}
	client.send(data);
};
