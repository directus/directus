import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import * as FieldsService from '../services/fields';
import validateCollection from '../middleware/validate-collection';
import { schemaInspector } from '../database';
import { FieldNotFoundException, InvalidPayloadException } from '../exceptions';
import Joi from '@hapi/joi';
import { Field } from '../types/field';

const router = Router();

router.get(
	'/',
	asyncHandler(async (req, res) => {
		const fields = await FieldsService.readAll();
		return res.json({ data: fields || null });
	})
);

router.get(
	'/:collection',
	validateCollection,
	asyncHandler(async (req, res) => {
		const fields = await FieldsService.readAll(req.collection);
		return res.json({ data: fields || null });
	})
);

router.get(
	'/:collection/:field',
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
	validateCollection,
	asyncHandler(async (req, res) => {
		const { error } = newFieldSchema.validate(req.body);

		if (error) {
			throw new InvalidPayloadException(error.message);
		}

		const field: Partial<Field> = req.body;

		const createdField = await FieldsService.createField(req.collection, field, {
			ip: req.ip,
			userAgent: req.get('user-agent'),
			user: req.user,
		});

		res.json({ data: createdField || null });
	})
);

export default router;
