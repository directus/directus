import type { DirectusExtension } from '../../../schema/extension.js';
import type { NestedPartial } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';
import { throwIfEmpty } from '../../utils/index.js';

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

/**
 * Update an existing extension.
 * @param id - UUID of the extension
 * @param data - Partial extension object
 * @returns Returns the extension that was updated
 */
export const updateExtension =
	<Schema>(
		id: DirectusExtension<Schema>['id'],
		data: NestedPartial<DirectusExtension<Schema>>,
	): RestCommand<DirectusExtension<Schema>, Schema> =>
	() => {
		throwIfEmpty(id, 'Id cannot be empty');

		return {
			path: `/extensions/${id}`,
			params: {},
			body: JSON.stringify(data),
			method: 'PATCH',
		};
	};
