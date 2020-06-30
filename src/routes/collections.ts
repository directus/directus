import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import sanitizeQuery from '../middleware/sanitize-query';
import validateQuery from '../middleware/validate-query';
import * as CollectionsService from '../services/collections';
import { schemaInspector } from '../database';
import { InvalidPayloadException, CollectionNotFoundException } from '../exceptions';
import Joi from '@hapi/joi';

const router = Router();

const fieldSchema = Joi.object({
	field: Joi.string().required(),
	datatype: Joi.string().required(),
	note: Joi.string().required(),
	primary_key: Joi.boolean(),
	auto_increment: Joi.boolean(),
});

const collectionSchema = Joi.object({
	collection: Joi.string().required(),
	fields: Joi.array().items(fieldSchema).min(1).unique().required(),
	note: Joi.string(),
});

router.post(
	'/',
	asyncHandler(async (req, res) => {
		const { error } = collectionSchema.validate(req.body);
		if (error) throw new InvalidPayloadException(error.message);

		const createdCollection = await CollectionsService.create(req.body);
		res.json({ data: createdCollection });
	})
);

router.get(
	'/',
	sanitizeQuery,
	validateQuery,
	asyncHandler(async (req, res) => {
		const data = await CollectionsService.readAll(req.sanitizedQuery);
		res.json({ data });
	})
);

router.get(
	'/:collection',
	sanitizeQuery,
	validateQuery,
	asyncHandler(async (req, res) => {
		const exists = await schemaInspector.hasTable(req.params.collection);

		if (exists === false) throw new CollectionNotFoundException(req.params.collection);

		const data = await CollectionsService.readOne(req.params.collection, req.sanitizedQuery);
		res.json({ data });
	})
);

export default router;
