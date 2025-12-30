import { callReference } from './call-reference.js';
import emitter from '../../../../emitter.js';
import type { FilterHandler, PromiseCallback } from '@directus/types';
import type { Reference } from 'isolated-vm';

export function registerFilterGenerator() {
	const unregisterFunctions: PromiseCallback[] = [];

	const registerFilter = (
		event: Reference<string>,
		cb: Reference<(payload: unknown) => unknown | Promise<unknown>>,
	) => {
		if (event.typeof !== 'string') throw new TypeError('Filter event has to be of type string');
		if (cb.typeof !== 'function') throw new TypeError('Filter handler has to be of type function');

		const eventCopied = event.copySync();

		const handler: FilterHandler = async (payload) => {
			const response = await callReference(cb, [payload]);

			return response.copy();
		};

		emitter.onFilter(eventCopied, handler);

		unregisterFunctions.push(() => {
			emitter.offFilter(eventCopied, handler);
		});
	};

	return { register: registerFilter, unregisterFunctions };
}
