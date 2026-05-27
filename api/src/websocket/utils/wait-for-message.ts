import { WebSocketMessage } from '@directus/types';
import { parseJSON } from '@directus/utils';
import type { RawData, WebSocket } from 'ws';
import { getMessageType } from './message.js';

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

			if (getMessageType(msg) === type) {
				clearTimeout(timer);
				client.off('message', awaitMessage);
				resolve(msg);
			}
		}
	});
};
