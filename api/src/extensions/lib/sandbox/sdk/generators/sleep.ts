import type { ExtensionSandboxRequestedScopes } from '@directus/extensions';
import type { Reference } from 'isolated-vm';
import { setTimeout } from 'node:timers/promises';

export function sleepGenerator(
	requestedScopes: ExtensionSandboxRequestedScopes
): (milliseconds: Reference<number>) => Promise<void> {
	return async (milliseconds) => {
		if (requestedScopes.sleep === undefined) throw new Error('No permission to access "sleep"');
		if (milliseconds.typeof !== 'number') throw new TypeError('Sleep milliseconds has to be of type number');

		const millisecondsCopied = await milliseconds.copy();

		await setTimeout(millisecondsCopied);
	};
}
