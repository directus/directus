import { Range, StatResponse } from '@directus/drive';
import { Knex } from 'knex';
import path from 'path';
import sharp, { ResizeOptions } from 'sharp';
import getDatabase from '../database';
import { RangeNotSatisfiableException, IllegalAssetTransformation } from '../exceptions';
import storage from '../storage';
import { AbstractServiceOptions, Accountability, Transformation } from '../types';
import { AuthorizationService } from './authorization';
import { Semaphore } from 'async-mutex';
import env from '../env';
import { File } from '../types';

sharp.concurrency(1);

// Note: don't put this in the service. The service can be initialized in multiple places, but they
// should all share the same semaphore instance.
const semaphore = new Semaphore(env.ASSETS_MAX_CONCURRENT_TRANSFORMATIONS);

export class AssetsService {
	knex: Knex;
	accountability: Accountability | null;
	authorizationService: AuthorizationService;

	constructor(options: AbstractServiceOptions) {
		this.knex = options.knex || getDatabase();
		this.accountability = options.accountability || null;
		this.authorizationService = new AuthorizationService(options);
	}

	async getAsset(
		id: string,
		transformation: Transformation,
		range?: Range
	): Promise<{ stream: NodeJS.ReadableStream; file: any; stat: StatResponse }> {
		const publicSettings = await this.knex
			.select('project_logo', 'public_background', 'public_foreground')
			.from('directus_settings')
			.first();

		const systemPublicKeys = Object.values(publicSettings || {});

		if (systemPublicKeys.includes(id) === false && this.accountability?.admin !== true) {
			await this.authorizationService.checkAccess('read', 'directus_files', id);
		}

		const file = (await this.knex.select('*').from('directus_files').where({ id }).first()) as File;

		if (range) {
			if (range.start >= file.filesize || (range.end && range.end >= file.filesize)) {
				throw new RangeNotSatisfiableException(range);
			}
		}

		const type = file.type;

		// We can only transform JPEG, PNG, and WebP
		if (type && Object.keys(transformation).length > 0 && ['image/jpeg', 'image/png', 'image/webp'].includes(type)) {
			const resizeOptions = this.parseTransformation(transformation);

			const assetFilename =
				path.basename(file.filename_disk, path.extname(file.filename_disk)) +
				this.getAssetSuffix(transformation) +
				path.extname(file.filename_disk);

			const { exists } = await storage.disk(file.storage).exists(assetFilename);

			if (exists) {
				return {
					stream: storage.disk(file.storage).getStream(assetFilename, range),
					file,
					stat: await storage.disk(file.storage).getStat(assetFilename),
				};
			}

			// Check image size before transforming. Processing an image that's too large for the
			// system memory will kill the API. Sharp technically checks for this too in it's
			// limitInputPixels, but we should have that check applied before starting the read streams
			const { width, height } = file;

			if (
				!width ||
				!height ||
				width > env.ASSETS_TRANSFORM_IMAGE_MAX_DIMENSION ||
				height > env.ASSETS_TRANSFORM_IMAGE_MAX_DIMENSION
			) {
				throw new IllegalAssetTransformation(
					`Image is too large to be transformed, or image size couldn't be determined.`
				);
			}

			return await semaphore.runExclusive(async () => {
				const readStream = storage.disk(file.storage).getStream(file.filename_disk, range);
				const transformer = sharp({
					limitInputPixels: Math.pow(env.ASSETS_TRANSFORM_IMAGE_MAX_DIMENSION, 2),
					sequentialRead: true,
				})
					.rotate()
					.resize(resizeOptions);

				if (transformation.quality) {
					transformer.toFormat(type.substring(6) as 'jpeg' | 'png' | 'webp', {
						quality: Number(transformation.quality),
					});
				}

				await storage.disk(file.storage).put(assetFilename, readStream.pipe(transformer), type);

				return {
					stream: storage.disk(file.storage).getStream(assetFilename, range),
					stat: await storage.disk(file.storage).getStat(assetFilename),
					file,
				};
			});
		} else {
			const readStream = storage.disk(file.storage).getStream(file.filename_disk, range);
			const stat = await storage.disk(file.storage).getStat(file.filename_disk);
			return { stream: readStream, file, stat };
		}
	}

	private parseTransformation(transformation: Transformation): ResizeOptions {
		const resizeOptions: ResizeOptions = {};

		if (transformation.width) resizeOptions.width = Number(transformation.width);
		if (transformation.height) resizeOptions.height = Number(transformation.height);
		if (transformation.fit) resizeOptions.fit = transformation.fit;
		if (transformation.withoutEnlargement)
			resizeOptions.withoutEnlargement = Boolean(transformation.withoutEnlargement);

		return resizeOptions;
	}

	private getAssetSuffix(transformation: Transformation) {
		if (Object.keys(transformation).length === 0) return '';

		return (
			'__' +
			Object.entries(transformation)
				.sort((a, b) => (a[0] > b[0] ? 1 : -1))
				.map((e) => e.join('_'))
				.join(',')
		);
	}
}
