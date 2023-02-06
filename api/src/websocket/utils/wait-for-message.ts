import type { WebSocket, RawData } from 'ws';
import type { WebSocketMessage } from '../types';
import { trimUpper } from './message';

export const waitForAnyMessage = (client: WebSocket, timeout: number): Promise<WebSocketMessage> => {
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
				resolve(JSON.parse(event.toString()));
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
				msg = JSON.parse(event.toString());
			} catch {
				return;
			}
			try {
				if (trimUpper(msg.type) === trimUpper(type)) {
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
