import collectionExists from '../middleware/collection-exists.js';
import { respond } from '../middleware/respond.js';
import { ExportService, ImportService } from '../services/import-export.js';
import { RevisionsService } from '../services/revisions.js';
import { UtilsService } from '../services/utils.js';
import asyncHandler from '../utils/async-handler.js';
import { generateHash } from '../utils/generate-hash.js';
import { sanitizeQuery } from '../utils/sanitize-query.js';
import { InvalidPayloadError, InvalidQueryError, UnsupportedMediaTypeError } from '@directus/errors';
import argon2 from 'argon2';
import Busboy from 'busboy';
import { Router } from 'express';
import Joi from 'joi';

const router = Router();

const randomStringSchema = Joi.object<{ length: number }>({
	length: Joi.number().integer().min(1).max(500).default(32),
});

router.get(
	'/random/string',
	asyncHandler(async (req, res) => {
		const { nanoid } = await import('nanoid');

		const { error, value } = randomStringSchema.validate(req.query, { allowUnknown: true });

		if (error) throw new InvalidQueryError({ reason: error.message });

		return res.json({ data: nanoid(value.length) });
	}),
);

router.post(
	'/hash/generate',
	asyncHandler(async (req, res) => {
		if (!req.body?.string) {
			throw new InvalidPayloadError({ reason: `"string" is required` });
		}

		const hash = await generateHash(req.body.string);

		return res.json({ data: hash });
	}),
);

router.post(
	'/hash/verify',
	asyncHandler(async (req, res) => {
		if (!req.body?.string) {
			throw new InvalidPayloadError({ reason: `"string" is required` });
		}

		if (!req.body?.hash) {
			throw new InvalidPayloadError({ reason: `"hash" is required` });
		}

		try {
			const result = await argon2.verify(req.body.hash, req.body.string);
			return res.json({ data: result });
		} catch {
			throw new InvalidPayloadError({ reason: `Invalid "hash" or "string"` });
		}
	}),
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
		if (error) throw new InvalidPayloadError({ reason: error.message });

		const service = new UtilsService({
			accountability: req.accountability,
			schema: req.schema,
		});

		await service.sort(req.collection, req.body);

		return res.status(200).end();
	}),
);

router.post(
	'/revert/:revision',
	asyncHandler(async (req, _res, next) => {
		const service = new RevisionsService({
			accountability: req.accountability,
			schema: req.schema,
		});

		await service.revert(req.params['revision']!);
		next();
	}),
	respond,
);

router.post(
	'/import/:collection',
	collectionExists,
	asyncHandler(async (req, res, next) => {
		if (req.is('multipart/form-data') === false) {
			throw new UnsupportedMediaTypeError({ mediaType: req.headers['content-type']!, where: 'Content-Type header' });
		}

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
				await service.import(req.params['collection']!, mimeType, fileStream);
			} catch (err: any) {
				return next(err);
			}

			return res.status(200).end();
		});

		busboy.on('error', (err: Error) => next(err));

		req.pipe(busboy);
	}),
);

router.post(
	'/export/:collection',
	collectionExists,
	asyncHandler(async (req, _res, next) => {
		if (!req.body.query) {
			throw new InvalidPayloadError({ reason: `"query" is required` });
		}

		if (!req.body.format) {
			throw new InvalidPayloadError({ reason: `"format" is required` });
		}

		const service = new ExportService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const sanitizedQuery = await sanitizeQuery(req.body.query, req.schema, req.accountability ?? null);

		// We're not awaiting this, as it's supposed to run async in the background
		service.exportToFile(req.params['collection']!, sanitizedQuery, req.body.format, {
			file: req.body.file,
		});

		return next();
	}),
	respond,
);

router.post(
	'/cache/clear',
	asyncHandler(async (req, res) => {
		const service = new UtilsService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const clearSystemCache = 'system' in req.query && (req.query['system'] === '' || Boolean(req.query['system']));

		await service.clearCache({ system: clearSystemCache });

		res.status(200).end();
	}),
);

export default router;
