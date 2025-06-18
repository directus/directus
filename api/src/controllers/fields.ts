import { TYPES } from '@directus/constants';
import { ForbiddenError, isDirectusError } from '@directus/errors';
import type { Field, RawField, Type } from '@directus/types';
import { Router } from 'express';
import Joi from 'joi';
import { ALIAS_TYPES } from '../constants.js';
import { ErrorCode, InvalidPayloadError } from '@directus/errors';
import validateCollection from '../middleware/collection-exists.js';
import { respond } from '../middleware/respond.js';
import useCollection from '../middleware/use-collection.js';
import { FieldsService, systemFieldUpdateSchema } from '../services/fields.js';
import asyncHandler from '../utils/async-handler.js';
import { isSystemField } from '@directus/system-data';

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

		res.locals['payload'] = { data: fields || null };
		return next();
	}),
	respond,
);

router.get(
	'/:collection',
	validateCollection,
	asyncHandler(async (req, res, next) => {
		const service = new FieldsService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const fields = await service.readAll(req.params['collection']);

		res.locals['payload'] = { data: fields || null };
		return next();
	}),
	respond,
);

router.get(
	'/:collection/:field',
	validateCollection,
	asyncHandler(async (req, res, next) => {
		const service = new FieldsService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const field = await service.readOne(req.params['collection']!, req.params['field']!);

		res.locals['payload'] = { data: field || null };
		return next();
	}),
	respond,
);

const newFieldSchema = Joi.object({
	collection: Joi.string().optional(),
	field: Joi.string().required(),
	type: Joi.string()
		.valid(...TYPES, ...ALIAS_TYPES)
		.allow(null)
		.optional(),
	schema: Joi.object({
		default_value: Joi.any(),
		max_length: [Joi.number(), Joi.string(), Joi.valid(null)],
		is_nullable: Joi.bool(),
	})
		.unknown()
		.allow(null),
	meta: Joi.any(),
});

router.post(
	'/:collection',
	validateCollection,
	asyncHandler(async (req, res, next) => {
		const service = new FieldsService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const { error } = newFieldSchema.validate(req.body);

		if (error) {
			throw new InvalidPayloadError({ reason: error.message });
		}

		const field: Partial<Field> & { field: string; type: Type | null } = req.body;

		await service.createField(req.params['collection']!, field, undefined, {
			attemptConcurrentIndex:
				'concurrentIndexCreation' in req.query && req.query['concurrentIndexCreation'] !== 'false',
		});

		try {
			const createdField = await service.readOne(req.params['collection']!, field.field);
			res.locals['payload'] = { data: createdField || null };
		} catch (error: any) {
			if (isDirectusError(error, ErrorCode.Forbidden)) {
				return next();
			}

			throw error;
		}

		return next();
	}),
	respond,
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
			throw new InvalidPayloadError({ reason: 'Submitted body has to be an array' });
		}

		for (const fieldData of req.body) {
			if (isSystemField(req.params['collection']!, fieldData['field']!)) {
				const { error } = systemFieldUpdateSchema.safeParse(fieldData);

				if (error) throw error.issues.map((details) => new InvalidPayloadError({ reason: details.message }));
			}
		}

		await service.updateFields(req.params['collection']!, req.body, {
			attemptConcurrentIndex:
				'concurrentIndexCreation' in req.query && req.query['concurrentIndexCreation'] !== 'false',
		});

		try {
			const results: any = [];

			for (const field of req.body) {
				const updatedField = await service.readOne(req.params['collection']!, field.field);
				results.push(updatedField);
				res.locals['payload'] = { data: results || null };
			}
		} catch (error: any) {
			if (isDirectusError(error, ErrorCode.Forbidden)) {
				return next();
			}

			throw error;
		}

		return next();
	}),
	respond,
);

const updateSchema = Joi.object({
	type: Joi.string()
		.valid(...TYPES, ...ALIAS_TYPES)
		.allow(null),
	schema: Joi.object({
		default_value: Joi.any(),
		max_length: [Joi.number(), Joi.string(), Joi.valid(null)],
		is_nullable: Joi.bool(),
	})
		.unknown()
		.allow(null),
	meta: Joi.any(),
}).unknown();

router.patch(
	'/:collection/:field',
	validateCollection,
	asyncHandler(async (req, res, next) => {
		const service = new FieldsService({
			accountability: req.accountability,
			schema: req.schema,
		});

		if (isSystemField(req.params['collection']!, req.params['field']!)) {
			const { error } = systemFieldUpdateSchema.safeParse(req.body);

			if (error) throw error.issues.map((details) => new InvalidPayloadError({ reason: details.message }));
		} else {
			const { error } = updateSchema.validate(req.body);

			if (error) throw new InvalidPayloadError({ reason: error.message });
		}

		const fieldData: RawField = req.body;

		if (!fieldData.field) fieldData.field = req.params['field']!;

		await service.updateField(req.params['collection']!, fieldData, {
			attemptConcurrentIndex:
				'concurrentIndexCreation' in req.query && req.query['concurrentIndexCreation'] !== 'false',
		});

		try {
			const updatedField = await service.readOne(req.params['collection']!, req.params['field']!);
			res.locals['payload'] = { data: updatedField || null };
		} catch (error: any) {
			if (isDirectusError(error, ErrorCode.Forbidden)) {
				return next();
			}

			throw error;
		}

		return next();
	}),
	respond,
);

router.delete(
	'/:collection/:field',
	validateCollection,
	asyncHandler(async (req, _res, next) => {
		const service = new FieldsService({
			accountability: req.accountability,
			schema: req.schema,
		});

		if (isSystemField(req.params['collection']!, req.params['field']!)) {
			throw new ForbiddenError();
		}

		await service.deleteField(req.params['collection']!, req.params['field']!);
		return next();
	}),
	respond,
);

export default router;
