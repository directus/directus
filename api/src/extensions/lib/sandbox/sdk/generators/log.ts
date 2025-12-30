import { useLogger } from '../../../../../logger/index.js';
import type { ExtensionSandboxRequestedScopes } from '@directus/extensions';
import type { Reference } from 'isolated-vm';

export function logGenerator(requestedScopes: ExtensionSandboxRequestedScopes): (message: Reference<string>) => void {
	const logger = useLogger();

	return (message) => {
		if (requestedScopes.log === undefined) throw new Error('No permission to access "log"');
		if (message.typeof !== 'string') throw new TypeError('Log message has to be of type string');

		const messageCopied = message.copySync();

		logger.info(messageCopied);
	};
}
