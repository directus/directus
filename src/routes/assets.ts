import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import storage from '../storage';
import database from '../database';
import sharp, { ResizeOptions } from 'sharp';
import fs from 'fs';

const router = Router();

router.get(
	'/:pk',
	asyncHandler(async (req, res) => {
		const file = await database
			.select('type', 'storage', 'filename_disk', 'filename_download')
			.from('directus_files')
			.where({ id: req.params.pk })
			.first();

		res.setHeader('Content-Disposition', 'attachment; filename=' + file.filename_download);
		res.setHeader('Content-Type', file.type);

		const resizeOptions: ResizeOptions = {};

		if (req.query.w) {
			resizeOptions.width = Number(req.query.w);
		}

		if (req.query.h) {
			resizeOptions.height = Number(req.query.h);
		}

		if (req.query.f) {
			resizeOptions.fit = req.query.f as ResizeOptions['fit'];
		}

		const assetFilename = file.filename_disk + getAssetSuffix(resizeOptions);

		const { exists } = await storage.disk(file.storage).exists(assetFilename);

		if (exists) {
			return storage.disk(file.storage).getStream(assetFilename).pipe(res);
		}

		// @todo add file-not-found error
		const readStream = storage.disk(file.storage).getStream(file.filename_disk);
		const transformer = sharp().resize(resizeOptions);
		readStream.pipe(transformer).pipe(res);
	})
);

export default router;

function getAssetSuffix(resizeOptions: ResizeOptions) {
	if (Object.keys(resizeOptions).length === 0) return '';

	return (
		'__' +
		Object.entries(resizeOptions)
			.sort((a, b) => (a[0] > b[0] ? 1 : -1))
			.map((e) => e.join('_'))
			.join(',')
	);
}
