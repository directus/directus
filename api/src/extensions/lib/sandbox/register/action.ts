import type { ActionHandler, PromiseCallback } from '@directus/types';
import type { Reference } from 'isolated-vm';
import emitter from '../../../../emitter.js';
import { callReference } from './call-reference.js';

export function registerActionGenerator() {
	const unregisterFunctions: PromiseCallback[] = [];

	const registerAction = (event: Reference<string>, cb: Reference<(payload: unknown) => void | Promise<void>>) => {
		if (event.typeof !== 'string') throw new TypeError('Action event has to be of type string');
		if (cb.typeof !== 'function') throw new TypeError('Action handler has to be of type function');

		const eventCopied = event.copySync();

		const handler: ActionHandler = (payload) => callReference(cb, [payload]);

		emitter.onAction(eventCopied, handler);

		unregisterFunctions.push(() => {
			emitter.offAction(eventCopied, handler);
		});
	};

	return { register: registerAction, unregisterFunctions };
}
