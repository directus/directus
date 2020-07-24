import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import * as FieldsService from '../services/fields';
import validateCollection from '../middleware/collection-exists';
import { schemaInspector } from '../database';
import { FieldNotFoundException, InvalidPayloadException } from '../exceptions';
import Joi from 'joi';
import { Field } from '../types/field';
import useCollection from '../middleware/use-collection';
import { Accountability, types } from '../types';

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
	collection: Joi.string().optional(),
	field: Joi.string().required(),
	type: Joi.string()
		.valid(...types)
		.required(),
	database: Joi.object({
		comment: Joi.string(),
		default_value: Joi.any(),
		max_length: [Joi.number(), Joi.string()],
		is_nullable: Joi.bool(),
	}),
	/** @todo base this on default validation */
	system: Joi.any(),
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

		const accountability: Accountability = {
			role: req.role,
			admin: req.admin,
			ip: req.ip,
			userAgent: req.get('user-agent'),
			user: req.user,
		};

		const field: Partial<Field> & { field: string; type: typeof types[number] } = req.body;

		await FieldsService.createField(req.collection, field, accountability);

		const createdField = await FieldsService.readOne(
			req.collection,
			field.field,
			accountability
		);

		return res.json({ data: createdField || null });
	})
);

router.delete(
	'/:collection/:field',
	useCollection('directus_fields'),
	validateCollection,
	asyncHandler(async (req, res) => {
		const accountability: Accountability = {
			role: req.role,
			admin: req.admin,
			ip: req.ip,
			userAgent: req.get('user-agent'),
			user: req.user,
		};

		await FieldsService.deleteField(req.collection, req.params.field, accountability);

		res.status(200).end();
	})
);

export default router;
