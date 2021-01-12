import { Router } from 'express';
import asyncHandler from '../utils/async-handler';
import { FieldsService } from '../services/fields';
import validateCollection from '../middleware/collection-exists';
import { InvalidPayloadException, ForbiddenException } from '../exceptions';
import Joi from 'joi';
import { types, Field } from '../types';
import useCollection from '../middleware/use-collection';
import { respond } from '../middleware/respond';

const router = Router();

router.use(useCollection('directus_fields'));

router.get(
	'/',
	asyncHandler(async (req, res, next) => {
		const service = new FieldsService({
			accountability: req.accountability,
			schema: req.schema,
		});
		const fields = await service.readAll();

		res.locals.payload = { data: fields || null };
		return next();
	}),
	respond
);

router.get(
	'/:collection',
	validateCollection,
	asyncHandler(async (req, res, next) => {
		const service = new FieldsService({
			accountability: req.accountability,
			schema: req.schema,
		});
		const fields = await service.readAll(req.params.collection);

		res.locals.payload = { data: fields || null };
		return next();
	}),
	respond
);

router.get(
	'/:collection/:field',
	validateCollection,
	asyncHandler(async (req, res, next) => {
		const service = new FieldsService({
			accountability: req.accountability,
			schema: req.schema,
		});

		if (req.params.field in req.schema[req.params.collection].columns === false) throw new ForbiddenException();

		const field = await service.readOne(req.params.collection, req.params.field);

		res.locals.payload = { data: field || null };
		return next();
	}),
	respond
);

const newFieldSchema = Joi.object({
	collection: Joi.string().optional(),
	field: Joi.string().required(),
	type: Joi.string().valid(...types, null),
	schema: Joi.object({
		default_value: Joi.any(),
		max_length: [Joi.number(), Joi.string(), Joi.valid(null)],
		is_nullable: Joi.bool(),
	}).unknown(),
	/** @todo base this on default validation */
	meta: Joi.any(),
});

router.post(
	'/:collection',
	validateCollection,
	asyncHandler(async (req, res, next) => {
		if (!req.body.schema && !req.body.meta) throw new InvalidPayloadException(`"schema" or "meta" is required`);

		const service = new FieldsService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const { error } = newFieldSchema.validate(req.body);

		if (error) {
			throw new InvalidPayloadException(error.message);
		}

		const field: Partial<Field> & { field: string; type: typeof types[number] } = req.body;

		await service.createField(req.params.collection, field);

		try {
			const createdField = await service.readOne(req.params.collection, field.field);
			res.locals.payload = { data: createdField || null };
		} catch (error) {
			if (error instanceof ForbiddenException) {
				return next();
			}

			throw error;
		}

		return next();
	}),
	respond
);

router.patch(
	'/:collection',
	validateCollection,
	asyncHandler(async (req, res, next) => {
		const service = new FieldsService({
			accountability: req.accountability,
			schema: req.schema,
		});

		if (Array.isArray(req.body) === false) {
			throw new InvalidPayloadException('Submitted body has to be an array.');
		}

		for (const field of req.body) {
			await service.updateField(req.params.collection, field);
		}

		try {
			let results: any = [];
			for (const field of req.body) {
				const updatedField = await service.readOne(req.params.collection, field.field);
				results.push(updatedField);
				res.locals.payload = { data: results || null };
			}
		} catch (error) {
			if (error instanceof ForbiddenException) {
				return next();
			}

			throw error;
		}

		return next();
	}),
	respond
);

router.patch(
	'/:collection/:field',
	validateCollection,
	// @todo: validate field
	asyncHandler(async (req, res, next) => {
		const service = new FieldsService({
			accountability: req.accountability,
			schema: req.schema,
		});
		const fieldData: Partial<Field> & { field: string; type: typeof types[number] } = req.body;

		if (!fieldData.field) fieldData.field = req.params.field;

		await service.updateField(req.params.collection, fieldData);

		try {
			const updatedField = await service.readOne(req.params.collection, req.params.field);
			res.locals.payload = { data: updatedField || null };
		} catch (error) {
			if (error instanceof ForbiddenException) {
				return next();
			}

			throw error;
		}

		return next();
	}),
	respond
);

router.delete(
	'/:collection/:field',
	validateCollection,
	asyncHandler(async (req, res, next) => {
		const service = new FieldsService({
			accountability: req.accountability,
			schema: req.schema,
		});
		await service.deleteField(req.params.collection, req.params.field);
		return next();
	}),
	respond
);

export default router;
