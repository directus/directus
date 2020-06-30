import { Transformation } from '../types/assets';
import storage from '../storage';
import sharp, { ResizeOptions } from 'sharp';
import database from '../database';
import path from 'path';

export const getAsset = async (id: string, transformation: Transformation) => {
	const file = await database.select('*').from('directus_files').where({ id }).first();

	const resizeOptions = parseTransformation(transformation);
	const assetFilename =
		path.basename(file.filename_disk, path.extname(file.filename_disk)) +
		getAssetSuffix(resizeOptions) +
		path.extname(file.filename_disk);

	const { exists } = await storage.disk(file.storage).exists(assetFilename);

	if (exists) {
		return { stream: storage.disk(file.storage).getStream(assetFilename), file };
	}

	const readStream = storage.disk(file.storage).getStream(file.filename_disk);
	const transformer = sharp().resize(resizeOptions);

	await storage.disk(file.storage).put(assetFilename, readStream.pipe(transformer));

	return { stream: storage.disk(file.storage).getStream(assetFilename), file };
};

function parseTransformation(transformation: Transformation): ResizeOptions {
	const resizeOptions: ResizeOptions = {};

	if (transformation.w) resizeOptions.width = Number(transformation.w);
	if (transformation.h) resizeOptions.height = Number(transformation.h);
	if (transformation.f) resizeOptions.fit = transformation.f;

	return resizeOptions;
}

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
