import { InvalidPayloadError } from '@directus/errors';
import type { Snapshot, SnapshotDiffWithHash } from '@directus/types';
import { toArray, toBoolean } from '@directus/utils';
import express from 'express';
import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';
import checkIsAdmin from '../middleware/is-admin.js';
import readFileUploadBody from '../middleware/read-file-upload-body.js';
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

router.post(
	'/diff',
	readFileUploadBody({ allowYaml: true }),
	asyncHandler(async (req, res, next) => {
		const service = new SchemaService({ accountability: req.accountability });
		const snapshot: Snapshot = req.body;
		const currentSnapshot = await service.snapshot();
		const snapshotDiff = await service.diff(snapshot, { currentSnapshot, force: 'force' in req.query });
		if (!snapshotDiff) return next();

		const currentSnapshotHash = getVersionedHash(currentSnapshot);
		res.locals['payload'] = { data: { hash: currentSnapshotHash, diff: snapshotDiff } };
		return next();
	}),
	respond,
);

router.post(
	'/apply',
	readFileUploadBody({ allowYaml: true }),
	asyncHandler(async (req, _res, next) => {
		const service = new SchemaService({ accountability: req.accountability });
		const diff: SnapshotDiffWithHash = req.body;
		await service.apply(diff, { force: toBoolean(req.query['force']) });
		return next();
	}),
	respond,
);

export default router;
