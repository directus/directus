import type { ExtensionSandboxRequestedScopes } from '@directus/extensions';
import type { Reference } from 'isolated-vm';
import logger from '../../../../../logger.js';

export function logGenerator(requestedScopes: ExtensionSandboxRequestedScopes): (message: Reference<string>) => void {
	return (message) => {
		if (requestedScopes.log === undefined) throw new Error('No permission to access "log"');
		if (message.typeof !== 'string') throw new TypeError('Log message has to be of type string');

		const messageCopied = message.copySync();

		logger.info(messageCopied);
	};
}
