import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import sanitizeQuery from '../middleware/sanitize-query';
import * as CollectionsService from '../services/collections';
import { schemaInspector } from '../database';
import { InvalidPayloadException, CollectionNotFoundException } from '../exceptions';
import Joi from 'joi';
import useCollection from '../middleware/use-collection';

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
	useCollection('directus_collections'),
	asyncHandler(async (req, res) => {
		const { error } = collectionSchema.validate(req.body);
		if (error) throw new InvalidPayloadException(error.message);

		const createdCollection = await CollectionsService.create(req.body, {
			role: req.role,
			admin: req.admin,
			ip: req.ip,
			userAgent: req.get('user-agent'),
			user: req.user,
		});

		res.json({ data: createdCollection || null });
	})
);

router.get(
	'/',
	useCollection('directus_collections'),
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		const collections = await CollectionsService.readAll(req.sanitizedQuery, {
			role: req.role,
			admin: req.admin,
		});
		res.json({ data: collections || null });
	})
);

router.get(
	'/:collection',
	useCollection('directus_collections'),
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		const exists = await schemaInspector.hasTable(req.params.collection);

		if (exists === false) throw new CollectionNotFoundException(req.params.collection);

		const collection = await CollectionsService.readOne(
			req.params.collection,
			req.sanitizedQuery,
			{ role: req.role, admin: req.admin }
		);
		res.json({ data: collection || null });
	})
);

router.delete(
	'/:collection',
	useCollection('directus_collections'),
	asyncHandler(async (req, res) => {
		if ((await schemaInspector.hasTable(req.params.collection)) === false) {
			throw new CollectionNotFoundException(req.params.collection);
		}

		await CollectionsService.deleteCollection(req.params.collection, {
			role: req.role,
			admin: req.admin,
			ip: req.ip,
			userAgent: req.get('user-agent'),
			user: req.user,
		});

		res.end();
	})
);

export default router;
