import type { RequestHandler } from 'express';
import { VersionsService } from "../services/versions.js";
import asyncHandler from '../utils/async-handler.js';
import { mergeVersionSaves } from '../utils/merge-version-saves.js';

/**
 * Checks and merges
 */
export const mergeContentVersions: RequestHandler = asyncHandler(async (req, res, next) => {
	if (
		req.sanitizedQuery.version &&
		req.sanitizedQuery.mergeVersionRelations &&
		req.collection &&
		(req.singleton || req.params['pk']) &&
		'data' in res.locals['payload']
	) {
		console.log('respond', req.sanitizedQuery)
		const versionsService = new VersionsService({ accountability: req.accountability ?? null, schema: req.schema });

		const saves = await versionsService.getVersionSaves(req.sanitizedQuery.version, req.collection, req.params['pk']);

		if (saves) {
			mergeVersionSaves({
				payload: res.locals['payload'].data,
				saves,
				collection: req.collection,
				schema: req.schema,
			});
		}
	}

	return next();
});
