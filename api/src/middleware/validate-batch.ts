import { RequestHandler } from 'express';
import asyncHandler from '../utils/async-handler';
import Joi from 'joi';
import { FailedValidationException, InvalidPayloadException } from '../exceptions';
import { sanitizeQuery } from '../utils/sanitize-query';

export const validateBatch = (scope: 'read' | 'update' | 'delete'): RequestHandler =>
	asyncHandler(async (req, res, next) => {
		if (req.method.toLowerCase() === 'get') {
			req.body = {};
			return next();
		}

		if (!req.body) throw new InvalidPayloadException('Payload in body is required');

		if (req.singleton) return next();

		// Every cRUD action has either keys or query
		let batchSchema = Joi.object().keys({
			keys: Joi.array().items(Joi.alternatives(Joi.string(), Joi.number())),
			query: Joi.object().unknown(),
		});

		// In reads, you can't combine the two, and 1 of the two at  least is required
		if (scope !== 'read') {
			batchSchema = batchSchema.xor('query', 'keys');
		}

		// In updates, we add a required `data` that holds the update payload
		if (scope === 'update') {
			batchSchema = batchSchema.keys({
				data: Joi.object().unknown().required(),
			});
		}

		// In deletes, we want to keep supporting an array of just primary keys
		if (scope === 'delete' && Array.isArray(req.body)) {
			return next();
		}

		const { error } = batchSchema.validate(req.body);

		if (error) {
			throw new FailedValidationException(error.details[0]);
		}

		// In reads, the query in the body should override the query params for searching
		if (scope === 'read' && req.body.query) {
			req.sanitizedQuery = sanitizeQuery(req.body.query, req.accountability);
		}

		return next();
	});
