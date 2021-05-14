import express from 'express';
import { respond } from '../../middleware/respond';
import { ItemsService } from '../../services';
import { Query } from '../../types';
import asyncHandler from '../../utils/async-handler';

import { generateTreeList } from './generate-tree-list';

const router = express.Router();

router.get(
	'/generate-tree-list/:collection',
	asyncHandler(async (req, res, next) => {
		const { collection } = req.params;

		// const { parentField, childrenField } = req.query;
		const parentField = 'parent';
		const childrenField = 'children';

		console.log(parentField, childrenField);

		const query: Query = {
			limit: -1,
		};
		const service = new ItemsService(collection, {
			accountability: req.accountability,
			schema: req.schema,
		});

		const items = await service.readByQuery(query);

		const { tree, list } = generateTreeList(items, parentField as string, childrenField as string);

		const data = { tree, list };

		res.locals.payload = {
			data: data || null,
		};

		return next();
	}),
	respond
);

export default router;
