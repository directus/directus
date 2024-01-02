import type { DirectusExtension } from '../../../schema/extension.js';
import type { NestedPartial } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';
import { throwIfEmpty } from '../../utils/index.js';

/**
 * Update an existing extension.
 * @param bundle - Bundle this extension is in
 * @param name - Unique name of the extension
 * @param data - Partial extension object
 * @returns Returns the extension that was updated
 */
export const updateExtension =
	<Schema extends object>(
		bundle: string | null,
		name: string,
		data: NestedPartial<DirectusExtension<Schema>>,
	): RestCommand<DirectusExtension<Schema>, Schema> =>
	() => {
		if (bundle !== null) throwIfEmpty(bundle, 'Bundle cannot be an empty string');
		throwIfEmpty(name, 'Name cannot be empty');

		return {
			path: bundle ? `/extensions/${bundle}/${name}` : `/extensions/${name}`,
			params: {},
			body: JSON.stringify(data),
			method: 'PATCH',
		};
	};
