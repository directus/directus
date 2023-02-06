import { BaseException } from '@directus/shared/exceptions';
import type { WebSocket } from 'ws';
import logger from '../logger';
import type { ResponseMessage, WebSocketClient } from './types';

export class WebSocketException extends Error {
	type: string;
	code: string;
	uid: string | undefined;
	constructor(type: string, code: string, message: string, uid?: string) {
		super(message);
		this.type = type;
		this.code = code;
		this.uid = uid;
	}
	toJSON(): ResponseMessage {
		const message: ResponseMessage = {
			type: this.type,
			status: 'error',
			error: {
				code: this.code,
				message: this.message,
			},
		};
		if (this.uid !== undefined) {
			message.uid = this.uid;
		}
		return message;
	}
	toMessage(): string {
		return JSON.stringify(this.toJSON());
	}
	static fromException(error: BaseException, type = 'unkown') {
		return new WebSocketException(type, error.code, error.message);
	}
}

export function handleWebsocketException(client: WebSocketClient | WebSocket, error: unknown, type?: string): void {
	if (error instanceof BaseException) {
		client.send(WebSocketException.fromException(error, type).toMessage());
		return;
	}
	if (error instanceof WebSocketException) {
		client.send(error.toMessage());
		return;
	}
	// unhandled exceptions
	logger.error('Unhandled exception' + JSON.stringify({ type, error }));
}
