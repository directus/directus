import { InvalidPayloadError, UnsupportedMediaTypeError } from '@directus/errors';
import type { Snapshot, SnapshotDiffWithHash } from '@directus/types';
import { parseJSON, toArray, toBoolean } from '@directus/utils';
import Busboy from 'busboy';
import type { RequestHandler } from 'express';
import express from 'express';
import { load as loadYaml } from 'js-yaml';
import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { useLogger } from '../logger/index.js';
import checkIsAdmin from '../middleware/is-admin.js';
import { respond } from '../middleware/respond.js';
import { SchemaService } from '../services/schema.js';
import asyncHandler from '../utils/async-handler.js';
import { getVersionedHash } from '../utils/get-versioned-hash.js';
import { resolveScopedCollections } from './schema/resolve-scoped-collections.js';

const router = express.Router();

/** Accepts a single collection name or a list, always normalizing to a string array. */
const collectionList = z.union([z.string(), z.array(z.string())]).transform((value) => toArray(value));

const snapshotQuerySchema = z
	.object({
		includeCollections: collectionList.optional(),
		excludeCollections: collectionList.optional(),
	})
	.refine((value) => !(value.includeCollections && value.excludeCollections), {
		message: `"includeCollections" and "excludeCollections" parameters cannot be used together`,
	});

router.get(
	'/snapshot',
	checkIsAdmin,
	asyncHandler(async (req, res, next) => {
		const parsed = snapshotQuerySchema.safeParse(req.query);
		if (!parsed.success) throw new InvalidPayloadError({ reason: fromZodError(parsed.error).message });

		// `null` (no scope) is full snapshot.
		const collections = resolveScopedCollections(req.schema, parsed.data) ?? undefined;

		const service = new SchemaService({ accountability: req.accountability });
		const currentSnapshot = await service.snapshot({ collections });
		res.locals['payload'] = { data: currentSnapshot };
		return next();
	}),
	respond,
);

const schemaMultipartHandler: RequestHandler = (req, res, next) => {
	if (req.is('application/json')) {
		if (Object.keys(req.body).length === 0) {
			throw new InvalidPayloadError({ reason: `No data was included in the body` });
		}

		res.locals['upload'] = req.body;
		return next();
	}

	if (!req.is('multipart/form-data')) {
		throw new UnsupportedMediaTypeError({ mediaType: req.headers['content-type']!, where: 'Content-Type header' });
	}

	const headers = req.headers['content-type']
		? req.headers
		: {
				...req.headers,
				'content-type': 'application/octet-stream',
			};

	const busboy = Busboy({ headers });

	let isFileIncluded = false;
	let upload: any | null = null;

	busboy.on('file', async (_, fileStream, { mimeType }) => {
		const logger = useLogger();

		if (isFileIncluded) return next(new InvalidPayloadError({ reason: `More than one file was included in the body` }));

		isFileIncluded = true;

		const { readableStreamToString } = await import('@directus/utils/node');

		try {
			const uploadedString = await readableStreamToString(fileStream);

			if (mimeType === 'application/json') {
				try {
					upload = parseJSON(uploadedString);
				} catch (err: any) {
					logger.warn(err);
					throw new InvalidPayloadError({ reason: 'The provided JSON is invalid' });
				}
			} else {
				try {
					upload = await loadYaml(uploadedString);
				} catch (err: any) {
					logger.warn(err);
					throw new InvalidPayloadError({ reason: 'The provided YAML is invalid' });
				}
			}

			if (!upload) {
				throw new InvalidPayloadError({ reason: `No file was included in the body` });
			}

			res.locals['upload'] = upload;

			return next();
		} catch (error: any) {
			busboy.emit('error', error);
		}
	});

	busboy.on('error', (error: Error) => next(error));

	busboy.on('close', () => {
		if (!isFileIncluded) return next(new InvalidPayloadError({ reason: `No file was included in the body` }));
	});

	req.pipe(busboy);
};

const diffQuerySchema = z.object({
	// A bare `?force` (empty string) counts as true; an explicit `?force=false` stays false.
	force: z
		.string()
		.optional()
		.transform((value) => value === '' || toBoolean(value)),
	mode: z.enum(['merge', 'mirror']).default('mirror'),
});

router.post(
	'/diff',
	checkIsAdmin,
	asyncHandler(schemaMultipartHandler),
	asyncHandler(async (req, res, next) => {
		const parsed = diffQuerySchema.safeParse(req.query);
		if (!parsed.success) throw new InvalidPayloadError({ reason: fromZodError(parsed.error).message });

		const service = new SchemaService({ accountability: req.accountability });
		const snapshot: Snapshot = res.locals['upload'];
		const currentSnapshot = await service.snapshot();

		const snapshotDiff = await service.diff(snapshot, {
			currentSnapshot,
			force: parsed.data.force,
			mode: parsed.data.mode,
		});

		if (!snapshotDiff) return next();

		const currentSnapshotHash = getVersionedHash(currentSnapshot);
		res.locals['payload'] = { data: { hash: currentSnapshotHash, diff: snapshotDiff } };
		return next();
	}),
	respond,
);

router.post(
	'/apply',
	checkIsAdmin,
	asyncHandler(schemaMultipartHandler),
	asyncHandler(async (req, res, next) => {
		const service = new SchemaService({ accountability: req.accountability });
		const diff: SnapshotDiffWithHash = res.locals['upload'];
		await service.apply(diff, { force: toBoolean(req.query['force']) });
		return next();
	}),
	respond,
);

export default router;
