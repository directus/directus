import { parseJSON } from '@directus/utils';
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
import { getSchema } from '../utils/get-schema.js';

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

// --- utility
const capitalize = (str: string) => str.split('_').map((s: string) => s[0]!.toUpperCase() + s.substring(1)).join('');
const translateType = (type: any) => {
	switch (type) {
		case 'timestamp': return 'number';
		case 'integer': return 'number';
		default: return 'string';
	}
}

router.get(
	'/types',
	asyncHandler(async (req, res) => {
		const schema = await getSchema();
		const rootSchema: Record<string, string> = {};
		let types = '// my-schema.d.ts\n';

		for (const cName in schema.collections) {
			const tName = capitalize(cName);
			const collection = schema.collections[cName]!;
			const pkType = translateType(collection.fields[collection.primary]?.type);
			const singular = collection.singleton ? '' : '[]';
			rootSchema[cName] = `${pkType}${singular} | ${tName}${singular}}`;
			const fields = collection.fields ?? {};

			types += `interface ${tName} {\n`;

			for (const fName in fields) {
				types += `\t${fName}: ${translateType(fields[fName]?.type)};\n`;
			}

			types += `}\n\n`;
		}

		res.header('content-type', 'text/plain');
		res.send(types);
	}),
	respond
)

export default router;
