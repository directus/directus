import type { DirectusExtension } from '../../../schema/extension.js';
import type { NestedPartial } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';
import { throwIfEmpty } from '../../utils/index.js';

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
