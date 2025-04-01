import type { RequestHandler } from 'express';
import asyncHandler from '../utils/async-handler.js';
import { getSchema } from '../utils/get-schema.js';

const schema: RequestHandler = asyncHandler(async (req, _res, next) => {
	req.schema = await getSchema();


	const schema = {
		collections: Object.fromEntries(Object.entries(req.schema.collections).filter(([keyBy, collection]) => {
			return collection.collection.startsWith("directus_") === false
		})),
		relations: req.schema.relations.filter((relation) => {
			return relation.collection.startsWith("directus_") === false && relation.related_collection?.startsWith("directus_") === false
		})
	}

	return next();
});

export default schema;
