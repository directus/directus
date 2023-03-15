import { parseJSON } from '@directus/shared/utils';
import type { WebSocket, RawData } from 'ws';
import { WebSocketMessage } from '../messages';

export const waitForAnyMessage = (client: WebSocket, timeout: number): Promise<Record<string, any>> => {
	return new Promise((resolve, reject) => {
		client.on('message', awaitMessage);
		const timer = setTimeout(() => {
			client.off('message', awaitMessage);
			reject();
		}, timeout);

		function awaitMessage(event: RawData) {
			try {
				clearTimeout(timer);
				client.off('message', awaitMessage);
				resolve(parseJSON(event.toString()));
			} catch (err) {
				reject(err);
			}
		}
	});
};

export const waitForMessageType = (client: WebSocket, type: string, timeout: number): Promise<WebSocketMessage> => {
	return new Promise((resolve, reject) => {
		client.on('message', awaitMessage);
		const timer = setTimeout(() => {
			client.off('message', awaitMessage);
			reject();
		}, timeout);

		function awaitMessage(event: RawData) {
			let msg: WebSocketMessage;
			try {
				msg = WebSocketMessage.parse(parseJSON(event.toString()));
			} catch {
				return;
			}
			try {
				if (msg?.type.toUpperCase() === type.toUpperCase()) {
					clearTimeout(timer);
					client.off('message', awaitMessage);
					resolve(msg);
				}
			} catch (err) {
				reject(msg);
			}
		}
	});
};
