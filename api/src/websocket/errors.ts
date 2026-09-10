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

	static fromError(error: DirectusError<unknown>, type = 'unknown', uid?: string | number) {
		return new WebSocketError(type, error.code, error.message, uid);
	}

	static fromZodError(error: ZodError, type = 'unknown', uid?: string | number) {
		const zError = fromZodError(error);
		return new WebSocketError(type, 'INVALID_PAYLOAD', zError.message, uid);
	}
}

/**
 * Send an error to the client
 *
 * Pass the `uid` of the message being handled so the client can tie the error back to it. A
 * WebSocketError carries its own uid and ignores the one passed here
 */
export function handleWebSocketError(
	client: WebSocketClient | WebSocket,
	error: unknown,
	type?: string,
	uid?: string | number,
): void {
	const logger = useLogger();

	if (isDirectusError(error)) {
		client.send(WebSocketError.fromError(error, type, uid).toMessage());
		return;
	}

	if (error instanceof WebSocketError) {
		client.send(error.toMessage());
		return;
	}

	if (error instanceof ZodError) {
		client.send(WebSocketError.fromZodError(error, type, uid).toMessage());
		return;
	}

	// unhandled exceptions
	logger.error(`WebSocket unhandled exception ${JSON.stringify({ type, error })}`);
}
