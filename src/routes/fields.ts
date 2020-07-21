import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import * as FieldsService from '../services/fields';
import validateCollection from '../middleware/collection-exists';
import { schemaInspector } from '../database';
import { FieldNotFoundException, InvalidPayloadException } from '../exceptions';
import Joi from '@hapi/joi';
import { Field } from '../types/field';
import useCollection from '../middleware/use-collection';

const router = Router();

/**
 * @TODO
 *
 * Add accountability / permissions handling to fields
 */

router.get(
	'/',
	useCollection('directus_fields'),
	asyncHandler(async (req, res) => {
		const fields = await FieldsService.readAll();
		return res.json({ data: fields || null });
	})
);

router.get(
	'/:collection',
	useCollection('directus_fields'),
	validateCollection,
	asyncHandler(async (req, res) => {
		const fields = await FieldsService.readAll(req.collection);
		return res.json({ data: fields || null });
	})
);

router.get(
	'/:collection/:field',
	useCollection('directus_fields'),
	validateCollection,
	asyncHandler(async (req, res) => {
		const exists = await schemaInspector.hasColumn(req.collection, req.params.field);
		if (exists === false) throw new FieldNotFoundException(req.collection, req.params.field);

		const field = await FieldsService.readOne(req.collection, req.params.field);
		return res.json({ data: field || null });
	})
);

const newFieldSchema = Joi.object({
	field: Joi.string().required(),
	database: Joi.object({
		type: Joi.string().required(),
	}).required(),
	system: Joi.object({
		hidden_browse: Joi.boolean(),
		/** @todo extract this dynamically from the DB schema */
	}),
});

router.post(
	'/:collection',
	useCollection('directus_fields'),
	validateCollection,
	asyncHandler(async (req, res) => {
		const { error } = newFieldSchema.validate(req.body);

		if (error) {
			throw new InvalidPayloadException(error.message);
		}

		const field: Partial<Field> & { field: string; database: { type: string } } = req.body;

		const createdField = await FieldsService.createField(req.collection, field, {
			role: req.role,
			admin: req.admin,
			ip: req.ip,
			userAgent: req.get('user-agent'),
			user: req.user,
		});

		res.json({ data: createdField || null });
	})
);

export default router;
