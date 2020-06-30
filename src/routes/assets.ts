import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import database from '../database';
import { SYSTEM_ASSET_WHITELIST, ASSET_GENERATION_QUERY_KEYS } from '../constants';
import { InvalidQueryException, ItemNotFoundException } from '../exceptions';
import * as AssetsService from '../services/assets';
import validate from 'uuid-validate';
import { pick } from 'lodash';
import { Transformation } from '../types/assets';

const router = Router();

router.get(
	'/:pk',

	// Check if file exists
	asyncHandler(async (req, res, next) => {
		const id = req.params.pk;

		/**
		 * This is a little annoying. Postgres will error out if you're trying to search in `where`
		 * with a wrong type. In case of directus_files where id is a uuid, we'll have to verify the
		 * validity of the uuid ahead of time.
		 * @todo move this to a validation middleware function
		 */
		const isValidUUID = validate(id, 4);
		if (isValidUUID === false) throw new ItemNotFoundException(id, 'directus_files');

		const file = await database.select('id').from('directus_files').where({ id });

		if (!file) throw new ItemNotFoundException(id, 'directus_files');

		return next();
	}),

	// Validate query params
	asyncHandler(async (req, res, next) => {
		const defaults = { asset_shortcuts: '[]', asset_generation: 'all' };

		const assetSettings =
			(await database
				.select('asset_shortcuts', 'asset_generation')
				.from('directus_settings')
				.first()) || defaults;

		const transformation = pick(req.query, ASSET_GENERATION_QUERY_KEYS);

		if (transformation.hasOwnProperty('key') && Object.keys(transformation).length > 1) {
			throw new InvalidQueryException(
				`You can't combine the "key" query parameter with any other transformation.`
			);
		}

		const systemKeys = SYSTEM_ASSET_WHITELIST.map((size) => size.key);
		const allKeys: string[] = [
			...systemKeys,
			...assetSettings.asset_shortcuts.map((size) => size.key),
		];

		// For use in the next request handler
		res.locals.shortcuts = [...SYSTEM_ASSET_WHITELIST, assetSettings.asset_shortcuts];
		res.locals.transformation = transformation;

		if (Object.keys(transformation).length === 0) {
			return next();
		}

		if (assetSettings.asset_generation === 'all') {
			if (transformation.key && allKeys.includes(transformation.key as string) === false)
				throw new InvalidQueryException(`Key "${transformation.key}" isn't configured.`);
			return next();
		} else if (assetSettings.asset_generation === 'shortcut') {
			if (allKeys.includes(transformation.key as string)) return next();
			throw new InvalidQueryException(
				`Only configured shortcuts can be used in asset generation.`
			);
		} else {
			if (transformation.key && systemKeys.includes(transformation.key as string))
				return next();
			throw new InvalidQueryException(
				`Dynamic asset generation has been disabled for this project.`
			);
		}
	}),

	// Return file
	asyncHandler(async (req, res) => {
		const transformation: Transformation = res.locals.transformation.key
			? res.locals.shortcuts.find((size) => size.key === res.locals.transformation.key)
			: res.locals.transformation;

		const { stream, file } = await AssetsService.getAsset(req.params.pk, transformation);

		res.setHeader('Content-Disposition', 'attachment; filename=' + file.filename_download);
		res.setHeader('Content-Type', file.type);

		stream.pipe(res);
	})
);

export default router;
