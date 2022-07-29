import { parseJSON } from '@directus/shared/utils';
import Busboy from 'busboy';
import { format } from 'date-fns';
import { RequestHandler, Router } from 'express';
import { load as loadYaml } from 'js-yaml';
import { Readable } from 'stream';
import { flushCaches } from '../cache';
import getDatabase from '../database';
import {
	ForbiddenException,
	InvalidPayloadException,
	RouteNotFoundException,
	UnsupportedMediaTypeException,
} from '../exceptions';
import { respond } from '../middleware/respond';
import { ServerService, SpecificationService } from '../services';
import { Snapshot } from '../types';
import { applySnapshot } from '../utils/apply-snapshot';
import asyncHandler from '../utils/async-handler';
import { getSnapshot } from '../utils/get-snapshot';
import { getSnapshotDiff } from '../utils/get-snapshot-diff';

const router = Router();

router.get(
	'/specs/oas',
	asyncHandler(async (req, res, next) => {
		const service = new SpecificationService({
			accountability: req.accountability,
			schema: req.schema,
		});

		res.locals.payload = await service.oas.generate();
		return next();
	}),
	respond
);

router.get(
	'/specs/graphql/:scope?',
	asyncHandler(async (req, res) => {
		const service = new SpecificationService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const serverService = new ServerService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const scope = req.params.scope || 'items';

		if (['items', 'system'].includes(scope) === false) throw new RouteNotFoundException(req.path);

		const info = await serverService.serverInfo();
		const result = await service.graphql.generate(scope as 'items' | 'system');
		const filename = info.project.project_name + '_' + format(new Date(), 'yyyy-MM-dd') + '.graphql';

		res.attachment(filename);
		res.send(result);
	})
);

router.get('/ping', (req, res) => res.send('pong'));

router.get(
	'/info',
	asyncHandler(async (req, res, next) => {
		const service = new ServerService({
			accountability: req.accountability,
			schema: req.schema,
		});
		const data = await service.serverInfo();
		res.locals.payload = { data };
		return next();
	}),
	respond
);

router.get(
	'/health',
	asyncHandler(async (req, res, next) => {
		const service = new ServerService({
			accountability: req.accountability,
			schema: req.schema,
		});

		const data = await service.health();

		res.setHeader('Content-Type', 'application/health+json');

		if (data.status === 'error') res.status(503);
		res.locals.payload = data;
		res.locals.cache = false;
		return next();
	}),
	respond
);

router.get(
	'/schema/snapshot',
	asyncHandler(async (req, res, next) => {
		if (req.accountability?.admin !== true) throw new ForbiddenException();

		await flushCaches();
		const database = getDatabase();
		const currentSnapshot = await getSnapshot({ database });

		res.locals.payload = {
			data: currentSnapshot,
		};

		return next();
	}),
	respond
);

const schemaMultipartHandler: RequestHandler = (req, res, next) => {
	if (req.is('application/json')) return next();

	if (!req.is('multipart/form-data')) throw new UnsupportedMediaTypeException(`Unsupported Content-Type header`);

	const headers = req.headers['content-type']
		? req.headers
		: {
				...req.headers,
				'content-type': 'application/octet-stream',
		  };

	const busboy = Busboy({ headers, limits: { files: 1 } });

	let fileCount = 0;
	let uploadedSnapshot: Snapshot | null = null;

	busboy.on('file', async (_, fileStream, { mimeType }) => {
		fileCount++;

		try {
			const uploadedString = await stringFromStream(fileStream);

			if (mimeType === 'application/json') {
				try {
					uploadedSnapshot = parseJSON(uploadedString);
				} catch (e) {
					throw new InvalidPayloadException('Invalid JSON snapshot');
				}
			} else {
				try {
					uploadedSnapshot = (await loadYaml(uploadedString)) as Snapshot;
				} catch (e) {
					throw new InvalidPayloadException('Invalid YAML snapshot');
				}
			}

			if (!uploadedSnapshot) {
				return next(new InvalidPayloadException(`No files were included in the body`));
			}

			res.locals.uploadedSnapshot = uploadedSnapshot;

			return next();
		} catch (error: any) {
			busboy.emit('error', error);
		}
	});

	busboy.on('error', (error: Error) => next(error));

	busboy.on('close', () => {
		if (fileCount === 0) return next(new InvalidPayloadException(`No files were included in the body`));
	});

	req.pipe(busboy);

	function stringFromStream(stream: Readable) {
		const chunks: Buffer[] = [];

		return new Promise<string>((resolve, reject) => {
			stream
				.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
				.on('error', (err: any) => {
					return reject(new InvalidPayloadException(err.message));
				})
				.on('end', () => {
					const streamString = Buffer.concat(chunks).toString('utf8');
					return resolve(streamString);
				});
		});
	}
};

router.post(
	'/schema/apply',
	asyncHandler(schemaMultipartHandler),
	asyncHandler(async (req, res, next) => {
		if (req.accountability?.admin !== true) throw new ForbiddenException();

		const snapshot: Snapshot = req.is('application/json') ? req.body : res.locals.uploadedSnapshot;

		await flushCaches();
		const database = getDatabase();
		const currentSnapshot = await getSnapshot({ database });
		const snapshotDiff = getSnapshotDiff(currentSnapshot, snapshot);

		if (
			snapshotDiff.collections.length === 0 &&
			snapshotDiff.fields.length === 0 &&
			snapshotDiff.relations.length === 0
		) {
			return next();
		}

		try {
			await applySnapshot(snapshot, { current: currentSnapshot, diff: snapshotDiff, database });
		} catch (err: any) {
			throw new InvalidPayloadException('Failed to apply snapshot');
		}

		return next();
	}),
	respond
);

router.post(
	'/schema/diff',
	asyncHandler(schemaMultipartHandler),
	asyncHandler(async (req, res, next) => {
		if (req.accountability?.admin !== true) throw new ForbiddenException();

		const snapshot: Snapshot = req.is('application/json') ? req.body : res.locals.uploadedSnapshot;

		await flushCaches();
		const database = getDatabase();
		const currentSnapshot = await getSnapshot({ database });
		const snapshotDiff = getSnapshotDiff(currentSnapshot, snapshot);

		if (
			snapshotDiff.collections.length === 0 &&
			snapshotDiff.fields.length === 0 &&
			snapshotDiff.relations.length === 0
		) {
			return next();
		}

		res.locals.payload = {
			data: snapshotDiff,
		};

		return next();
	}),
	respond
);

export default router;
