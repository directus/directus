import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import FieldsService from '../services/fields';
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
		const service = new FieldsService({ accountability: req.accountability });

		const fields = await service.readAll();
		return res.json({ data: fields || null });
	})
);

router.get(
	'/:collection',
	validateCollection,
	useCollection('directus_fields'),
	asyncHandler(async (req, res) => {
		const service = new FieldsService({ accountability: req.accountability });

		const fields = await service.readAll(req.params.collection);
		return res.json({ data: fields || null });
	})
);

router.get(
	'/:collection/:field',
	validateCollection,
	useCollection('directus_fields'),
	asyncHandler(async (req, res) => {
		const service = new FieldsService({ accountability: req.accountability });

		const exists = await schemaInspector.hasColumn(req.collection, req.params.field);
		if (exists === false) throw new FieldNotFoundException(req.collection, req.params.field);

		const field = await service.readOne(req.params.collection, req.params.field);
		return res.json({ data: field || null });
	})
);

const newFieldSchema = Joi.object({
	collection: Joi.string().optional(),
	field: Joi.string().required(),
	type: Joi.string().valid(...types),
	schema: Joi.object({
		comment: Joi.string(),
		default_value: Joi.any(),
		max_length: [Joi.number(), Joi.string()],
		is_nullable: Joi.bool(),
	}),
	/** @todo base this on default validation */
	meta: Joi.any(),
});

router.post(
	'/:collection',
	validateCollection,
	useCollection('directus_fields'),
	asyncHandler(async (req, res) => {
		const service = new FieldsService({ accountability: req.accountability });

		const { error } = newFieldSchema.validate(req.body);

		if (error) {
			throw new InvalidPayloadException(error.message);
		}

		const field: Partial<Field> & { field: string; type: typeof types[number] } = req.body;

		await service.createField(req.params.collection, field);

		const createdField = await service.readOne(req.params.collection, field.field);

		return res.json({ data: createdField || null });
	})
);

router.patch(
	'/:collection',
	validateCollection,
	useCollection('directus_fields'),
	asyncHandler(async (req, res) => {
		const service = new FieldsService({ accountability: req.accountability });

		if (Array.isArray(req.body) === false)
			throw new InvalidPayloadException('Submitted body has to be an array.');

		let results: any = [];

		for (const field of req.body) {
			await service.updateField(req.params.collection, field, req.accountability);

			const updatedField = await service.readOne(req.params.collection, field.field);

			results.push(updatedField);
		}

		return res.json({ data: results || null });
	})
);

router.patch(
	'/:collection/:field',
	validateCollection,
	useCollection('directus_fields'),
	// @todo: validate field
	asyncHandler(async (req, res) => {
		const service = new FieldsService({ accountability: req.accountability });

		const fieldData: Partial<Field> & { field: string; type: typeof types[number] } = req.body;

		if (!fieldData.field) fieldData.field = req.params.field;

		await service.updateField(req.params.collection, fieldData, req.accountability);

		const updatedField = await service.readOne(req.params.collection, req.params.field);

		return res.json({ data: updatedField || null });
	})
);

router.delete(
	'/:collection/:field',
	validateCollection,
	useCollection('directus_fields'),
	asyncHandler(async (req, res) => {
		const service = new FieldsService({ accountability: req.accountability });

		await service.deleteField(req.params.collection, req.params.field, req.accountability);

		res.status(200).end();
	})
);

export default router;
