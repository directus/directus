import type { DirectusApiError, DirectusError } from '../types/error.js';

export class RequestError<R = Response> extends Error implements DirectusError<R> {
	override readonly name = 'RequestError';
	readonly response: R;
	readonly errors: DirectusApiError[];
	readonly data?: any;

	constructor(message: string, context: { response: R; errors: DirectusApiError[]; data?: any }) {
		super(message);

		this.response = context.response;
		this.errors = context.errors;
		if (context.data !== undefined) this.data = context.data;
	}
}
