import { Range, StatResponse } from '@directus/drive';
import { Semaphore } from 'async-mutex';
import { Knex } from 'knex';
import { contentType } from 'mime-types';
import hash from 'object-hash';
import path from 'path';
import sharp from 'sharp';
import getDatabase from '../database';
import env from '../env';
import { IllegalAssetTransformation, RangeNotSatisfiableException, ForbiddenException } from '../exceptions';
import storage from '../storage';
import { AbstractServiceOptions, File, Transformation, TransformationParams, TransformationPreset } from '../types';
import { Accountability } from '@directus/shared/types';
import { AuthorizationService } from './authorization';
import * as TransformationUtils from '../utils/transformations';
import validateUUID from 'uuid-validate';

sharp.concurrency(1);

// Note: don't put this in the service. The service can be initialized in multiple places, but they
// should all share the same semaphore instance.
const semaphore = new Semaphore(env.ASSETS_TRANSFORM_MAX_CONCURRENT);

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
		transformation: TransformationParams | TransformationPreset,
		range?: Range
	): Promise<{ stream: NodeJS.ReadableStream; file: any; stat: StatResponse }> {
		const publicSettings = await this.knex
			.select('project_logo', 'public_background', 'public_foreground')
			.from('directus_settings')
			.first();

		const systemPublicKeys = Object.values(publicSettings || {});

		/**
		 * This is a little annoying. Postgres will error out if you're trying to search in `where`
		 * with a wrong type. In case of directus_files where id is a uuid, we'll have to verify the
		 * validity of the uuid ahead of time.
		 */
		const isValidUUID = validateUUID(id, 4);

		if (isValidUUID === false) throw new ForbiddenException();

		if (systemPublicKeys.includes(id) === false && this.accountability?.admin !== true) {
			await this.authorizationService.checkAccess('read', 'directus_files', id);
		}

		const file = (await this.knex.select('*').from('directus_files').where({ id }).first()) as File;

		if (!file) throw new ForbiddenException();

		const { exists } = await storage.disk(file.storage).exists(file.filename_disk);

		if (!exists) throw new ForbiddenException();

		if (range) {
			if (range.start >= file.filesize || (range.end && range.end >= file.filesize)) {
				throw new RangeNotSatisfiableException(range);
			}
		}

		const type = file.type;
		const transforms = TransformationUtils.resolvePreset(transformation, file);

		// We can only transform JPEG, PNG, and WebP
		if (type && transforms.length > 0 && ['image/jpeg', 'image/png', 'image/webp', 'image/tiff'].includes(type)) {
			const maybeNewFormat = TransformationUtils.maybeExtractFormat(transforms);

			const assetFilename =
				path.basename(file.filename_disk, path.extname(file.filename_disk)) +
				getAssetSuffix(transforms) +
				(maybeNewFormat ? `.${maybeNewFormat}` : path.extname(file.filename_disk));

			const { exists } = await storage.disk(file.storage).exists(assetFilename);

			if (maybeNewFormat) {
				file.type = contentType(assetFilename) || null;
			}

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
				}).rotate();

				transforms.forEach(([method, ...args]) => (transformer[method] as any).apply(transformer, args));

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
}

const getAssetSuffix = (transforms: Transformation[]) => {
	if (Object.keys(transforms).length === 0) return '';
	return `__${hash(transforms)}`;
};
