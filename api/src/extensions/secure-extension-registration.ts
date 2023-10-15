import type { ActionHandler, FilterHandler, PromiseCallback } from '@directus/types';
import type { Reference } from 'isolated-vm';
import ivm from 'isolated-vm';
import { setTimeout } from 'node:timers/promises';
import emitter from '../emitter.js';
import env from '../env.js';
import logger from '../logger.js';

export function log(message: Reference<string>): void {
	if (message.typeof !== 'string') throw new Error('Log message has to be of type string');

	logger.info(message.copySync());
}

export async function timeout(milliseconds: Reference<number>): Promise<void> {
	if (milliseconds.typeof !== 'number') throw new Error('Timeout message has to be of type number');

	await setTimeout(await milliseconds.copy());
}

export function registerFilterGenerator() {
	const scriptTimeoutMs = Number(env['EXTENSIONS_SECURE_TIMEOUT']);

	const filterUnregisterFunctions: PromiseCallback[] = [];

	const filter = (event: Reference<string>, cb: Reference<(payload: unknown) => unknown | Promise<unknown>>) => {
		if (event.typeof !== 'string') throw new Error('Filter event has to be of type string');
		if (cb.typeof !== 'function') throw new Error('Filter handler has to be of type function');

		const eventCopied = event.copySync();

		const handler: FilterHandler = async (payload) => {
			const response = await cb.apply(null, [new ivm.ExternalCopy(payload).copyInto()], {
				result: { reference: true, promise: true },
				timeout: scriptTimeoutMs,
			});

			return response.copy();
		};

		emitter.onFilter(eventCopied, handler);

		filterUnregisterFunctions.push(() => {
			emitter.offFilter(eventCopied, handler);
		});
	};

	return { filter, filterUnregisterFunctions };
}

export function registerActionGenerator() {
	const scriptTimeoutMs = Number(env['EXTENSIONS_SECURE_TIMEOUT']);

	const actionUnregisterFunctions: PromiseCallback[] = [];

	const action = (event: Reference<string>, cb: Reference<(payload: unknown) => void | Promise<void>>) => {
		if (event.typeof !== 'string') throw new Error('Action event has to be of type string');
		if (cb.typeof !== 'function') throw new Error('Action handler has to be of type function');

		const eventCopied = event.copySync();

		const handler: ActionHandler = (payload) =>
			cb.apply(null, [new ivm.ExternalCopy(payload).copyInto()], {
				result: { reference: true, promise: true },
				timeout: scriptTimeoutMs,
			});

		emitter.onAction(eventCopied, handler);

		actionUnregisterFunctions.push(() => {
			emitter.offAction(eventCopied, handler);
		});
	};

	return { action, actionUnregisterFunctions };
}
