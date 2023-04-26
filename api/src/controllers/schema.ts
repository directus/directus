import { parseJSON } from '@directus/utils';
import Busboy from 'busboy';
import type { RequestHandler } from 'express';
import express from 'express';
import { load as loadYaml } from 'js-yaml';
import { InvalidPayloadException, UnsupportedMediaTypeException } from '../exceptions/index.js';
import logger from '../logger.js';
import { respond } from '../middleware/respond.js';
import { SchemaService } from '../services/schema.js';
import type { Snapshot, SnapshotDiffWithHash } from '../types/index.js';
import asyncHandler from '../utils/async-handler.js';
import { getVersionedHash } from '../utils/get-versioned-hash.js';

const router = express.Router();

router.get(
	'/snapshot',
	asyncHandler(async (req, res, next) => {
		const service = new SchemaService({ accountability: req.accountability });
		const currentSnapshot = await service.snapshot();
		res.locals['payload'] = { data: currentSnapshot };
		return next();
	}),
	respond
);

const schemaMultipartHandler: RequestHandler = (req, res, next) => {
	if (req.is('application/json')) {
		if (Object.keys(req.body).length === 0) {
			throw new InvalidPayloadException(`No data was included in the body`);
		}

		res.locals['upload'] = req.body;
		return next();
	}

	if (!req.is('multipart/form-data')) {
		throw new UnsupportedMediaTypeException(`Unsupported Content-Type header`);
	}

	const headers = req.headers['content-type']
		? req.headers
		: {
				...req.headers,
				'content-type': 'application/octet-stream',
		  };

	const busboy = Busboy({ headers });

	let isFileIncluded = false;
	let upload: Snapshot | SnapshotDiffWithHash | null = null;

	busboy.on('file', async (_, fileStream, { mimeType }) => {
		if (isFileIncluded) return next(new InvalidPayloadException(`More than one file was included in the body`));

		isFileIncluded = true;

		const { readableStreamToString } = await import('@directus/utils/node');

		try {
			const uploadedString = await readableStreamToString(fileStream);

			if (mimeType === 'application/json') {
				try {
					upload = parseJSON(uploadedString);
				} catch (err: any) {
					logger.warn(err);
					throw new InvalidPayloadException('Invalid JSON schema snapshot');
				}
			} else {
				try {
					upload = (await loadYaml(uploadedString)) as Snapshot;
				} catch (err: any) {
					logger.warn(err);
					throw new InvalidPayloadException('Invalid YAML schema snapshot');
				}
			}

			if (!upload) {
				throw new InvalidPayloadException(`No file was included in the body`);
			}

			res.locals['upload'] = upload;

			return next();
		} catch (error: any) {
			busboy.emit('error', error);
		}
	});

	busboy.on('error', (error: Error) => next(error));

	busboy.on('close', () => {
		if (!isFileIncluded) return next(new InvalidPayloadException(`No file was included in the body`));
	});

	req.pipe(busboy);
};

router.post(
	'/apply',
	asyncHandler(schemaMultipartHandler),
	asyncHandler(async (req, res, next) => {
		const service = new SchemaService({ accountability: req.accountability });
		const diff: SnapshotDiffWithHash = res.locals['upload'];
		await service.apply(diff);
		return next();
	}),
	respond
);

router.post(
	'/diff',
	asyncHandler(schemaMultipartHandler),
	asyncHandler(async (req, res, next) => {
		const service = new SchemaService({ accountability: req.accountability });
		const snapshot: Snapshot = res.locals['upload'];
		const currentSnapshot = await service.snapshot();
		const snapshotDiff = await service.diff(snapshot, { currentSnapshot, force: 'force' in req.query });
		if (!snapshotDiff) return next();

		const currentSnapshotHash = getVersionedHash(currentSnapshot);
		res.locals['payload'] = { data: { hash: currentSnapshotHash, diff: snapshotDiff } };
		return next();
	}),
	respond
);

export default router;
