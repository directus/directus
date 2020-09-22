import storage from '../storage';
import sharp, { ResizeOptions } from 'sharp';
import database from '../database';
import path from 'path';
import Knex from 'knex';
import { Accountability, AbstractServiceOptions, Transformation } from '../types';

export class AssetsService {
	knex: Knex;
	accountability: Accountability | null;

	constructor(options?: AbstractServiceOptions) {
		this.knex = options?.knex || database;
		this.accountability = options?.accountability || null;
	}

	async getAsset(id: string, transformation: Transformation) {
		const file = await database.select('*').from('directus_files').where({ id }).first();

		const type = file.type;

		// We can only transform JPEG, PNG, and WebP
		if (['image/jpeg', 'image/png', 'image/webp'].includes(type)) {
			const resizeOptions = this.parseTransformation(transformation);
			const assetFilename =
				path.basename(file.filename_disk, path.extname(file.filename_disk)) +
				this.getAssetSuffix(resizeOptions) +
				path.extname(file.filename_disk);

			const { exists } = await storage.disk(file.storage).exists(assetFilename);

			if (exists) {
				return { stream: storage.disk(file.storage).getStream(assetFilename), file };
			}

			const readStream = storage.disk(file.storage).getStream(file.filename_disk);
			const transformer = sharp().resize(resizeOptions);

			await storage.disk(file.storage).put(assetFilename, readStream.pipe(transformer));

			return { stream: storage.disk(file.storage).getStream(assetFilename), file };
		} else {
			const readStream = storage.disk(file.storage).getStream(file.filename_disk);
			return { stream: readStream, file };
		}
	}

	private parseTransformation(transformation: Transformation): ResizeOptions {
		const resizeOptions: ResizeOptions = {};

		if (transformation.w) resizeOptions.width = Number(transformation.w);
		if (transformation.h) resizeOptions.height = Number(transformation.h);
		if (transformation.f) resizeOptions.fit = transformation.f;

		return resizeOptions;
	}

	private getAssetSuffix(resizeOptions: ResizeOptions) {
		if (Object.keys(resizeOptions).length === 0) return '';

		return (
			'__' +
			Object.entries(resizeOptions)
				.sort((a, b) => (a[0] > b[0] ? 1 : -1))
				.map((e) => e.join('_'))
				.join(',')
		);
	}
}
