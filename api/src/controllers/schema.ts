import { InvalidPayloadError, UnsupportedMediaTypeError } from '@directus/errors';
import type { Snapshot, SnapshotDiffWithHash } from '@directus/types';
import { parseJSON } from '@directus/utils';
import Busboy from 'busboy';
import type { RequestHandler } from 'express';
import express from 'express';
import { load as loadYaml } from 'js-yaml';
import { useLogger } from '../logger/index.js';
import { respond } from '../middleware/respond.js';
import { SchemaService } from '../services/schema.js';
import asyncHandler from '../utils/async-handler.js';
import { getSnapshot } from '../utils/get-snapshot.js';

const router = express.Router();

router.get(
	'/snapshot',
	asyncHandler(async (req, res, next) => {
		const service = new SchemaService({ accountability: req.accountability });
		const currentSnapshot = await service.snapshot();
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

router.post(
	'/diff',
	asyncHandler(schemaMultipartHandler),
	asyncHandler(async (req, res, next) => {
		const service = new SchemaService({ accountability: req.accountability });
		const snapshot: Snapshot = res.locals['upload'];
		// service.diff() internally fetches the current snapshot with includeUntracked: true
		// so db-only tables produce "edit" diffs instead of "new" diffs.
		const snapshotDiff = await service.diff(snapshot, { force: 'force' in req.query });
		if (!snapshotDiff) return next();

		// The hash must match what service.apply() will compute (also with includeUntracked)
		const currentSnapshotHash = service.getHashedSnapshot(await getSnapshot({ includeUntracked: true })).hash;

		res.locals['payload'] = { data: { hash: currentSnapshotHash, diff: snapshotDiff } };
		return next();
	}),
	respond,
);

router.post(
	'/apply',
	asyncHandler(schemaMultipartHandler),
	asyncHandler(async (req, res, next) => {
		const service = new SchemaService({ accountability: req.accountability });
		const diff: SnapshotDiffWithHash = res.locals['upload'];
		await service.apply(diff);
		return next();
	}),
	respond,
);

export default router;
