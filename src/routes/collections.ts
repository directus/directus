import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import database, { schemaInspector } from '../database';
import * as ItemsService from '../services/items';
import sanitizeQuery from '../middleware/sanitize-query';
import validateQuery from '../middleware/validate-query';
import { Table } from '../../../../knex-schema-inspector/lib/types/table';
import { Collection } from '../types/collection';

const router = Router();

router.get(
	'/',
	sanitizeQuery,
	validateQuery,
	asyncHandler(async (req, res) => {
		const [tables, collections] = await Promise.all([
			schemaInspector.tables(),
			ItemsService.readItems<Collection>('directus_collections', req.sanitizedQuery),
		]);

		const data = (tables as Table[]).map((table) => {
			const collectionInfo = collections.find((collection) => {
				return collection.collection === table.name;
			});

			return {
				collection: table.name,
				note: table.comment,
				hidden: collectionInfo?.hidden || false,
				single: collectionInfo?.single || false,
				icon: collectionInfo?.icon || null,
				translation: collectionInfo?.translation || null,
			};
		});

		res.json({ data });
	})
);

export default router;
