import type { Accountability } from '@directus/types';
import getDatabase from '../../../database/index.js';
import { fetchAllowedFields } from '../../../permissions/modules/fetch-allowed-fields/fetch-allowed-fields.js';
import { getSchema } from '../../../utils/get-schema.js';

export async function hasFieldPermision(
	accountability: Accountability,
	collection: string,
	field: string,
	type: 'read' | 'update' = 'read',
): Promise<boolean> {
	if (accountability.admin === true) {
		return true;
	}

	const allowedFields = await fetchAllowedFields(
		{ accountability, action: type, collection },
		{ knex: getDatabase(), schema: await getSchema() },
	);

	return allowedFields.some((f) => f === field || f === '*');
}
