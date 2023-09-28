import { parseJSON } from '@directus/utils';
import { buildSchema, renderSchema, type DataModel } from '@directus/sdk-schema-generator';
import Busboy from 'busboy';
import type { RequestHandler } from 'express';
import express from 'express';
import { load as loadYaml } from 'js-yaml';
import { InvalidPayloadError, UnsupportedMediaTypeError } from '../errors/index.js';
import logger from '../logger.js';
import { respond } from '../middleware/respond.js';
import { SchemaService } from '../services/schema.js';
import type { Snapshot, SnapshotDiffWithHash } from '../types/index.js';
import asyncHandler from '../utils/async-handler.js';
import { getVersionedHash } from '../utils/get-versioned-hash.js';
import { CollectionsService } from '../services/collections.js';
import { FieldsService } from '../services/fields.js';
import { RelationsService } from '../services/relations.js';
import { getSchema } from '../utils/get-schema.js';
import type { Collection } from '@directus/types';

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
		const currentSnapshot = await service.snapshot();
		const snapshotDiff = await service.diff(snapshot, { currentSnapshot, force: 'force' in req.query });
		if (!snapshotDiff) return next();

		const currentSnapshotHash = getVersionedHash(currentSnapshot);
		res.locals['payload'] = { data: { hash: currentSnapshotHash, diff: snapshotDiff } };
		return next();
	}),
	respond
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
	respond
);

router.get(
	'/sdk',
	asyncHandler(async (req, res) => {
		const schema = await getSchema();
		const accountability = req.accountability;
		const collectionService = new CollectionsService({ accountability, schema });
		const relationService = new RelationsService({ accountability, schema });
		const fieldService = new FieldsService({ accountability, schema });

		const dataModel = await Promise.all([
			collectionService.readByQuery(),
			relationService.readAll(),
			fieldService.readAll(),
		]).then(([_collections, relations, fields]) => ({
			// Currently the CollectionsService doesnt return
			// the Collection type from @directus/types
			collections: _collections as Collection[],
			fields, relations
		} as DataModel));


		const schemaObject = await buildSchema(dataModel, {
			nameTransform: 'database'
		});

		const schemaString = renderSchema(schemaObject);

		res.setHeader('Content-Type', 'text/plain'/*'application/typescript'*/);
		res.send(schemaString);
	})
)

export default router;
