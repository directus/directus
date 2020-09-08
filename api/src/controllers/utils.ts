import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { nanoid } from 'nanoid';
import { InvalidQueryException, InvalidPayloadException } from '../exceptions';
import argon2 from 'argon2';
import collectionExists from '../middleware/collection-exists';
import UtilsService from '../services/utils';
import Joi from 'joi';

const router = Router();

router.get(
	'/random/string',
	asyncHandler(async (req, res) => {
		if (req.query && req.query.length && Number(req.query.length) > 500)
			throw new InvalidQueryException(`"length" can't be more than 500 characters`);

		const string = nanoid(req.query?.length ? Number(req.query.length) : 32);

		return res.json({ data: string });
	})
);

router.post(
	'/hash',
	asyncHandler(async (req, res) => {
		if (!req.body?.string) {
			throw new InvalidPayloadException(`"string" is required`);
		}

		const hash = await argon2.hash(req.body.string);

		return res.json({ data: hash });
	})
);

router.post(
	'/hash/verify',
	asyncHandler(async (req, res) => {
		if (!req.body?.string) {
			throw new InvalidPayloadException(`"string" is required`);
		}

		if (!req.body?.hash) {
			throw new InvalidPayloadException(`"hash" is required`);
		}

		const result = await argon2.verify(req.body.hash, req.body.string);

		return res.json({ data: result });
	})
);

const SortSchema = Joi.object({
	item: Joi.alternatives(Joi.string(), Joi.number()).required(),
	to: Joi.alternatives(Joi.string(), Joi.number()).required(),
});

router.post(
	'/sort/:collection',
	collectionExists,
	asyncHandler(async (req, res) => {
		const { error } = SortSchema.validate(req.body);
		if (error) throw new InvalidPayloadException(error.message);

		const service = new UtilsService({ accountability: req.accountability });
		await service.sort(req.collection, req.body);

		return res.status(200).end();
	})
);

export default router;
