import { BaseException } from '@directus/exceptions';
import type { WebSocket } from 'ws';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';
import logger from '../logger.js';
import type { WebSocketResponse } from './messages.js';
import type { WebSocketClient } from './types.js';

export class WebSocketException extends Error {
	type: string;
	code: string;
	uid: string | number | undefined;
	constructor(type: string, code: string, message: string, uid?: string | number) {
		super(message);
		this.type = type;
		this.code = code;
		this.uid = uid;
	}

	toJSON(): WebSocketResponse {
		const message: WebSocketResponse = {
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

	static fromException(error: BaseException, type = 'unknown') {
		return new WebSocketException(type, error.code, error.message);
	}

	static fromZodError(error: ZodError, type = 'unknown') {
		const zError = fromZodError(error);
		return new WebSocketException(type, 'INVALID_PAYLOAD', zError.message);
	}
}

export function handleWebSocketException(client: WebSocketClient | WebSocket, error: unknown, type?: string): void {
	if (error instanceof BaseException) {
		client.send(WebSocketException.fromException(error, type).toMessage());
		return;
	}

	if (error instanceof WebSocketException) {
		client.send(error.toMessage());
		return;
	}

	if (error instanceof ZodError) {
		client.send(WebSocketException.fromZodError(error, type).toMessage());
		return;
	}

	// unhandled exceptions
	logger.error(`WebSocket unhandled exception ${JSON.stringify({ type, error })}`);
}
