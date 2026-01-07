import { type DirectusError, isDirectusError } from '@directus/errors';
import type { WebSocket } from 'ws';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { useLogger } from '../logger/index.js';
import type { WebSocketResponse } from './messages.js';
import type { WebSocketClient } from './types.js';

export class WebSocketError extends Error {
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

	static fromError(error: DirectusError<unknown>, type = 'unknown') {
		return new WebSocketError(type, error.code, error.message);
	}

	static fromZodError(error: ZodError, type = 'unknown') {
		const zError = fromZodError(error);
		return new WebSocketError(type, 'INVALID_PAYLOAD', zError.message);
	}
}

export function handleWebSocketError(client: WebSocketClient | WebSocket, error: unknown, type?: string): void {
	const logger = useLogger();

	if (isDirectusError(error)) {
		client.send(WebSocketError.fromError(error, type).toMessage());
		return;
	}

	if (error instanceof WebSocketError) {
		client.send(error.toMessage());
		return;
	}

	if (error instanceof ZodError) {
		client.send(WebSocketError.fromZodError(error, type).toMessage());
		return;
	}

	// unhandled exceptions
	logger.error(`WebSocket unhandled exception ${JSON.stringify({ type, error })}`);
}
