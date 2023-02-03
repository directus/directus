import argon2 from 'argon2';
import { Router } from 'express';
import Joi from 'joi';
import {
	ForbiddenException,
	InvalidPayloadException,
	InvalidQueryException,
	UnsupportedMediaTypeException,
} from '../exceptions';
import collectionExists from '../middleware/collection-exists';
import { respond } from '../middleware/respond';
import { RevisionsService, UtilsService, ImportService, ExportService } from '../services';
import asyncHandler from '../utils/async-handler';
import Busboy from 'busboy';
import { flushCaches } from '../cache';
import { generateHash } from '../utils/generate-hash';
import { sanitizeQuery } from '../utils/sanitize-query';

const router = Router();

router.get(
	'/random/string',
	asyncHandler(async (req, res) => {
		const { nanoid } = await import('nanoid');

		if (req.query && req.query.length && Number(req.query.length) > 500)
			throw new InvalidQueryException(`"length" can't be more than 500 characters`);

		const string = nanoid(req.query?.length ? Number(req.query.length) : 32);

		return res.json({ data: string });
	})
);

router.post(
	'/hash/generate',
	asyncHandler(async (req, res) => {
		if (!req.body?.string) {
			throw new InvalidPayloadException(`"string" is required`);
		}

		const hash = await generateHash(req.body.string);

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

		const service = new UtilsService({
			accountability: req.accountability,
			schema: req.schema,
		});
		await service.sort(req.collection, req.body);

		return res.status(200).end();
	})
);

router.post(
	'/revert/:revision',
	asyncHandler(async (req, res, next) => {
		const service = new RevisionsService({
			accountability: req.accountability,
			schema: req.schema,
		});
		await service.revert(req.params.revision);
		next();
	}),
	respond
);

router.post(
	'/import/:collection',
	collectionExists,
	asyncHandler(async (req, res, next) => {
		if (req.is('multipart/form-data') === false)
			throw new UnsupportedMediaTypeException(`Unsupported Content-Type header`);

		const service = new ImportService({
			accountability: req.accountability,
			schema: req.schema,
		});

		let headers;

		if (req.headers['content-type']) {
			headers = req.headers;
		} else {
			headers = {
				...req.headers,
				'content-type': 'application/octet-stream',
			};
		}

		const busboy = Busboy({ headers });

		busboy.on('file', async (_fieldname, fileStream, { mimeType }) => {
			try {
				await service.import(req.params.collection, mimeType, fileStream);
			} catch (err: any) {
				return next(err);
			}

			return res.status(200).end();
		});

		busboy.on('error', (err: Error) => next(err));

		req.pipe(busboy);
	})
);

router.post(
	'/export/:collection',
	collectionExists,
	asyncHandler(async (req, res, next) => {
		if (!req.body.query) {
			throw new InvalidPayloadException(`"query" is required.`);
		}

		if (!req.body.format) {
			throw new InvalidPayloadException(`"format" is required.`);
		}

		const service = new ExportService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const sanitizedQuery = sanitizeQuery(req.body.query, req.accountability ?? null);

		// We're not awaiting this, as it's supposed to run async in the background
		service.exportToFile(req.params.collection, sanitizedQuery, req.body.format, {
			file: req.body.file,
		});

		return next();
	}),
	respond
);

router.post(
	'/cache/clear',
	asyncHandler(async (req, res) => {
		if (req.accountability?.admin !== true) {
			throw new ForbiddenException();
		}

		await flushCaches(true);

		res.status(200).end();
	})
);

export default router;
