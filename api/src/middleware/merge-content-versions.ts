import { isObject } from '@directus/utils';
import type { RequestHandler } from 'express';
import { VersionsService } from '../services/versions.js';
import asyncHandler from '../utils/async-handler.js';
import { mergeVersionsRaw, mergeVersionsRecursive } from '../utils/merge-version-data.js';

export const mergeContentVersions: RequestHandler = asyncHandler(async (req, res, next) => {
	if (
		req.sanitizedQuery.version &&
		req.collection &&
		(req.singleton || req.params['pk']) &&
		'data' in res.locals['payload']
	) {
		const originalData = res.locals['payload'].data as unknown;

		// only act on single item requests
		if (!isObject(originalData)) return next();

		const versionsService = new VersionsService({ accountability: req.accountability ?? null, schema: req.schema });

		const versionData = await versionsService.getVersionSaves(
			req.sanitizedQuery.version,
			req.collection,
			req.params['pk'],
		);

		if (!versionData || versionData.length === 0) return next();

		if (req.sanitizedQuery.versionRaw) {
			res.locals['payload'].data = mergeVersionsRaw(originalData, versionData);
		} else {
			res.locals['payload'].data = mergeVersionsRecursive(originalData, versionData, req.collection, req.schema);
		}
	}

	return next();
});
