import { getModel } from '../../../lib/get-model.js';
import { generateObject } from 'ai';
import { ItemsService } from '../../../../services/index.js';
import getDatabase from '../../../../database/index.js';
import { getSchema } from '../../../../utils/get-schema.js';
import { z } from 'zod';

export const translate = async (
	collection: string,
	primaryKey: string | number,
	fields: string[],
	language: string,
) => {
	const schema = await getSchema();

	const service = new ItemsService(collection, {
		knex: getDatabase(),
		schema,
	});

	const item = await service.readOne(primaryKey, { fields });

	const itemSchema: Record<string, z.core.SomeType> = {};

	// @TODO collection might not exist
	const outputSchema = z.object(Object.fromEntries(Object.entries(schema.collections[collection]!.fields!).filter(([field, def]) => {
		return fields.includes(field);
	}).map(([field, def]) => {
		// Create zod schema from field def
		// ^ should be global util
		return [field, zSchema];
	}));

	// Call generateObject with zod outputs schema
	// System prompt something like "Create translation without coming up with random shit"
};
