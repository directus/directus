import type { RestCommand } from '../../types.js';
import { throwIfEmpty } from '../../utils/index.js';

/**
 * Install an extension from the registry.
 * @param extensionId - Registry extension ID
 * @param version - Version ID to install
 * @returns Nothing
 * @throws Will throw if extensionId or version is empty
 */
export const installRegistryExtension =
	<Schema>(extensionId: string, version: string): RestCommand<void, Schema> =>
	() => {
		throwIfEmpty(extensionId, 'Extension id cannot be empty');
		throwIfEmpty(version, 'Version cannot be empty');

		return {
			path: `/extensions/registry/install`,
			body: JSON.stringify({ extension: extensionId, version }),
			method: 'POST',
		};
	};

/**
 * Reinstall an extension from the registry.
 * @param extensionId - Registry extension ID
 * @returns Nothing
 * @throws Will throw if extensionId is empty
 */
export const reinstallRegistryExtension =
	<Schema>(extensionId: string): RestCommand<void, Schema> =>
	() => {
		throwIfEmpty(extensionId, 'Extension id cannot be empty');

		return {
			path: `/extensions/registry/reinstall`,
			body: JSON.stringify({ extension: extensionId }),
			method: 'POST',
		};
	};
