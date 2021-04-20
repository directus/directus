import { RequestHandler } from 'express';
import asyncHandler from '../utils/async-handler';
import Joi from 'joi';
import { FailedValidationException, InvalidPayloadException } from '../exceptions';

export const validateBatch = (scope: 'update' | 'delete'): RequestHandler =>
	asyncHandler(async (req, res, next) => {
		if (!req.body) throw new InvalidPayloadException('Payload in body is required');

		let batchSchema = Joi.object()
			.keys({
				keys: Joi.array().items(Joi.alternatives(Joi.string(), Joi.number())),
				query: Joi.object().unknown(),
			})
			.xor('query', 'keys');

		if (scope === 'update') {
			batchSchema = batchSchema.keys({
				data: Joi.object().unknown().required(),
			});
		}

		// Accept an array of primary keys as batch payload for deletes
		if (scope === 'delete' && Array.isArray(req.body)) {
			return next();
		}

		const { error } = batchSchema.validate(req.body);

		if (error) {
			throw new FailedValidationException(error.details[0]);
		}

		return next();
	});
