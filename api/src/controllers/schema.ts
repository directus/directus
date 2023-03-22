import { parseJSON } from '@directus/shared/utils';
import Busboy from 'busboy';
import express, { RequestHandler } from 'express';
import { load as loadYaml } from 'js-yaml';
import { InvalidPayloadException, UnsupportedMediaTypeException } from '../exceptions';
import logger from '../logger';
import { respond } from '../middleware/respond';
import { SchemaService } from '../services/schema';
import type { Snapshot } from '../types';
import asyncHandler from '../utils/async-handler';
import { getVersionedHash } from '../utils/get-versioned-hash';

const router = express.Router();

router.get(
	'/snapshot',
	asyncHandler(async (req, res, next) => {
		const service = new SchemaService({ accountability: req.accountability });
		const currentSnapshot = await service.snapshot();
		res.locals.payload = { data: currentSnapshot };
		return next();
	}),
	respond
);

router.post(
	'/apply',
	asyncHandler(async (req, _res, next) => {
		const service = new SchemaService({ accountability: req.accountability });
		await service.apply(req.body);
		return next();
	}),
	respond
);

const schemaMultipartHandler: RequestHandler = (req, res, next) => {
	if (req.is('application/json')) {
		if (Object.keys(req.body).length === 0) throw new InvalidPayloadException(`No data was included in the body`);
		res.locals.uploadedSnapshot = req.body;
		return next();
	}

	if (!req.is('multipart/form-data')) throw new UnsupportedMediaTypeException(`Unsupported Content-Type header`);

	const headers = req.headers['content-type']
		? req.headers
		: {
				...req.headers,
				'content-type': 'application/octet-stream',
		  };

	const busboy = Busboy({ headers });

	let isFileIncluded = false;
	let uploadedSnapshot: Snapshot | null = null;

	busboy.on('file', async (_, fileStream, { mimeType }) => {
		if (isFileIncluded) return next(new InvalidPayloadException(`More than one file was included in the body`));

		isFileIncluded = true;

		const { readableStreamToString } = await import('@directus/utils/node');

		try {
			const uploadedString = await readableStreamToString(fileStream);

			if (mimeType === 'application/json') {
				try {
					uploadedSnapshot = parseJSON(uploadedString);
				} catch (err: any) {
					logger.warn(err);
					throw new InvalidPayloadException('Invalid JSON schema snapshot');
				}
			} else {
				try {
					uploadedSnapshot = (await loadYaml(uploadedString)) as Snapshot;
				} catch (err: any) {
					logger.warn(err);
					throw new InvalidPayloadException('Invalid YAML schema snapshot');
				}
			}

			if (!uploadedSnapshot) throw new InvalidPayloadException(`No file was included in the body`);

			res.locals.uploadedSnapshot = uploadedSnapshot;

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
	'/diff',
	asyncHandler(schemaMultipartHandler),
	asyncHandler(async (req, res, next) => {
		const service = new SchemaService({ accountability: req.accountability });
		const snapshot: Snapshot = res.locals.uploadedSnapshot;

		const currentSnapshot = await service.snapshot();
		const snapshotDiff = await service.diff(snapshot, { currentSnapshot, force: 'force' in req.query });
		if (!snapshotDiff) return next();

		const currentSnapshotHash = getVersionedHash(currentSnapshot);
		res.locals.payload = { data: { hash: currentSnapshotHash, diff: snapshotDiff } };
		return next();
	}),
	respond
);

export default router;
