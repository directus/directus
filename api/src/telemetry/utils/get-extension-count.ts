import { type Knex } from 'knex';
import { ExtensionsService } from '../../services/extensions.js';
import { getSchema } from '../../utils/get-schema.js';

export interface ExtensionCount {
	/**
	 * Total count of enabled extensions excluding Bundle-Parents,
	 * meaning a Bundle extensions with one extension inside of it counts as one.
	 */
	totalEnabled: number;
}

export const getExtensionCount = async (db: Knex): Promise<ExtensionCount> => {
	const extensionsService = new ExtensionsService({
		knex: db,
		schema: await getSchema({ database: db }),
	});

	const extensions = await extensionsService.readAll();

	let totalEnabled = 0;

	for (const extension of extensions) {
		if (extension.meta.enabled && extension.schema && extension.schema.type !== 'bundle') {
			totalEnabled++;
		}
	}

	return {
		totalEnabled,
	};
};
