import { ForbiddenError } from '@directus/errors';
import type { ExtensionSandboxRequestedScopes } from '@directus/extensions';
import { isSystemCollection } from '@directus/system-data';
import type { Query } from '@directus/types';
import type { Reference } from 'isolated-vm';
import { ItemsService } from '../../../../../services/index.js';
import { getSchema } from '../../../../../utils/get-schema.js';

export function readItemsGenerator(
	requestedScopes: ExtensionSandboxRequestedScopes,
): (collection: Reference<string>, query: Reference<Query>) => Promise<any[]> {
	return async (collection, query) => {
		if (collection.typeof !== 'string') throw new TypeError('Collection name has to be of type string');
		if (query.typeof !== 'object') throw new TypeError('Query has to be of type object');

		const permissions = requestedScopes.items;

		if (permissions === undefined) throw new Error('No permission to access "items"');

		if (!permissions.methods.includes('read')) {
			throw new Error('No permission to read "items"');
		}

		const collectionCopied = await collection.copy();
		const queryCopied = await query.copy();

		if (isSystemCollection(collectionCopied)) throw new ForbiddenError();

		const schema = await getSchema();

		const service = new ItemsService(collectionCopied, {
			// TODO: Check accountability
			// accountability: {
			// 	role: null,
			// },
			schema,
		});

		return await service.readByQuery(queryCopied);
	};
}
