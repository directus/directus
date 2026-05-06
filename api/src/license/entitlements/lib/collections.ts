import { isSystemCollection } from '@directus/system-data';
import { getSchema } from '../../../utils/get-schema.js';

/**
 * Counting the current user collections
 */
export async function countActiveCollections() {
	const schema = await getSchema();

	return (
		// LICENSE-TODO
		// exclude disabled collections
		// exclude folders collections
		// exclude db only collections
		Object.keys(schema.collections).filter((collection) => !isSystemCollection(collection)).length
	);
}
