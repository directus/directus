import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import * as FieldsService from '../services/fields';
import validateCollection from '../middleware/validate-collection';
import { schemaInspector } from '../database';
import { FieldNotFoundException } from '../exceptions';

const router = Router();

router.get(
	'/',
	asyncHandler(async (req, res) => {
		const fields = await FieldsService.readAll();
		return res.json({ data: fields });
	})
);

router.get(
	'/:collection',
	validateCollection,
	asyncHandler(async (req, res) => {
		const fields = await FieldsService.readAll(req.collection);
		return res.json({ data: fields });
	})
);

router.get(
	'/:collection/:field',
	validateCollection,
	asyncHandler(async (req, res) => {
		const exists = await schemaInspector.hasColumn(req.collection, req.params.field);
		if (exists === false) throw new FieldNotFoundException(req.collection, req.params.field);

		const field = await FieldsService.readOne(req.collection, req.params.field);
		return res.json({ data: field });
	})
);

export default router;
