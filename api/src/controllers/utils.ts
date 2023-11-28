import argon2 from 'argon2';
import Busboy from 'busboy';
import { Router } from 'express';
import Joi from 'joi';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { InvalidPayloadError, InvalidQueryError, UnsupportedMediaTypeError } from '@directus/errors';
import collectionExists from '../middleware/collection-exists.js';
import { respond } from '../middleware/respond.js';
import type { ImportWorkerData } from '../services/import-export/import-worker.js';
import { ExportService } from '../services/import-export/index.js';
import { RevisionsService } from '../services/revisions.js';
import { UtilsService } from '../services/utils.js';
import asyncHandler from '../utils/async-handler.js';
import { generateHash } from '../utils/generate-hash.js';
import { sanitizeQuery } from '../utils/sanitize-query.js';

const router = Router();

router.get(
	'/random/string',
	asyncHandler(async (req, res) => {
		const { nanoid } = await import('nanoid');

		if (req.query && req.query['length'] && Number(req.query['length']) > 500) {
			throw new InvalidQueryError({ reason: `"length" can't be more than 500 characters` });
		}

		const string = nanoid(req.query?.['length'] ? Number(req.query['length']) : 32);

		return res.json({ data: string });
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

		const result = await argon2.verify(req.body.hash, req.body.string);

		return res.json({ data: result });
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
			const { createTmpFile } = await import('@directus/utils/node');
			const { getWorkerPool } = await import('../worker-pool.js');

			const tmpFile = await createTmpFile().catch(() => null);

			if (!tmpFile) throw new Error('Failed to create temporary file for import');

			fileStream.pipe(fs.createWriteStream(tmpFile.path));

			fileStream.on('end', async () => {
				const workerPool = getWorkerPool();

				const require = createRequire(import.meta.url);
				const filename = require.resolve('../services/import-export/import-worker');

				const workerData: ImportWorkerData = {
					collection: req.params['collection']!,
					mimeType,
					filePath: tmpFile.path,
					accountability: req.accountability,
					schema: req.schema,
				};

				try {
					await workerPool.run(workerData, { filename });
					res.status(200).end();
				} catch (error) {
					next(error);
				} finally {
					await tmpFile.cleanup();
				}
			});
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

		const sanitizedQuery = sanitizeQuery(req.body.query, req.accountability ?? null);

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

		await service.clearCache();

		res.status(200).end();
	}),
);

export default router;
