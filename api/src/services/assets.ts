import type { Range, Stat } from '@directus/storage';
import type { Accountability } from '@directus/types';
import type { Knex } from 'knex';
import { clamp } from 'lodash-es';
import { contentType } from 'mime-types';
import type { Readable } from 'node:stream';
import hash from 'object-hash';
import path from 'path';
import sharp from 'sharp';
import validateUUID from 'uuid-validate';
import { SUPPORTED_IMAGE_TRANSFORM_FORMATS } from '../constants.js';
import getDatabase from '../database/index.js';
import env from '../env.js';
import { ForbiddenException } from '../exceptions/forbidden.js';
import { IllegalAssetTransformation } from '../exceptions/illegal-asset-transformation.js';
import { RangeNotSatisfiableException } from '../exceptions/range-not-satisfiable.js';
import { ServiceUnavailableException } from '../exceptions/service-unavailable.js';
import logger from '../logger.js';
import { getStorage } from '../storage/index.js';
import type { AbstractServiceOptions, File, Transformation, TransformationSet } from '../types/index.js';
import { getMilliseconds } from '../utils/get-milliseconds.js';
import * as TransformationUtils from '../utils/transformations.js';
import { AuthorizationService } from './authorization.js';

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
		transformation: TransformationSet,
		range?: Range
	): Promise<{ stream: Readable; file: any; stat: Stat }> {
		const storage = await getStorage();

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

		const exists = await storage.location(file.storage).exists(file.filename_disk);

		if (!exists) throw new ForbiddenException();

		if (range) {
			const missingRangeLimits = range.start === undefined && range.end === undefined;
			const endBeforeStart = range.start !== undefined && range.end !== undefined && range.end <= range.start;
			const startOverflow = range.start !== undefined && range.start >= file.filesize;
			const endUnderflow = range.end !== undefined && range.end <= 0;

			if (missingRangeLimits || endBeforeStart || startOverflow || endUnderflow) {
				throw new RangeNotSatisfiableException(range);
			}

			const lastByte = file.filesize - 1;

			if (range.end) {
				if (range.start === undefined) {
					// fetch chunk from tail
					range.start = file.filesize - range.end;
					range.end = lastByte;
				}

				if (range.end >= file.filesize) {
					// fetch entire file
					range.end = lastByte;
				}
			}

			if (range.start) {
				if (range.end === undefined) {
					// fetch entire file
					range.end = lastByte;
				}

				if (range.start < 0) {
					// fetch file from head
					range.start = 0;
				}
			}
		}

		const type = file.type;
		const transforms = TransformationUtils.resolvePreset(transformation, file);

		if (type && transforms.length > 0 && SUPPORTED_IMAGE_TRANSFORM_FORMATS.includes(type)) {
			const maybeNewFormat = TransformationUtils.maybeExtractFormat(transforms);

			const assetFilename =
				path.basename(file.filename_disk, path.extname(file.filename_disk)) +
				getAssetSuffix(transforms) +
				(maybeNewFormat ? `.${maybeNewFormat}` : path.extname(file.filename_disk));

			const exists = await storage.location(file.storage).exists(assetFilename);

			if (maybeNewFormat) {
				file.type = contentType(assetFilename) || null;
			}

			if (exists) {
				return {
					stream: await storage.location(file.storage).read(assetFilename, range),
					file,
					stat: await storage.location(file.storage).stat(assetFilename),
				};
			}

			// Check image size before transforming. Processing an image that's too large for the
			// system memory will kill the API. Sharp technically checks for this too in it's
			// limitInputPixels, but we should have that check applied before starting the read streams
			const { width, height } = file;

			if (
				!width ||
				!height ||
				width > env['ASSETS_TRANSFORM_IMAGE_MAX_DIMENSION'] ||
				height > env['ASSETS_TRANSFORM_IMAGE_MAX_DIMENSION']
			) {
				throw new IllegalAssetTransformation(
					`Image is too large to be transformed, or image size couldn't be determined.`
				);
			}

			const { queue, process } = sharp.counters();

			if (queue + process > env['ASSETS_TRANSFORM_MAX_CONCURRENT']) {
				throw new ServiceUnavailableException('Server too busy', {
					service: 'files',
				});
			}

			const readStream = await storage.location(file.storage).read(file.filename_disk, range);

			const transformer = sharp({
				limitInputPixels: Math.pow(env['ASSETS_TRANSFORM_IMAGE_MAX_DIMENSION'], 2),
				sequentialRead: true,
				failOn: env['ASSETS_INVALID_IMAGE_SENSITIVITY_LEVEL'],
			});

			transformer.timeout({
				seconds: clamp(Math.round(getMilliseconds(env['ASSETS_TRANSFORM_TIMEOUT'], 0) / 1000), 1, 3600),
			});

			if (transforms.find((transform) => transform[0] === 'rotate') === undefined) transformer.rotate();

			transforms.forEach(([method, ...args]) => (transformer[method] as any).apply(transformer, args));

			readStream.on('error', (e: Error) => {
				logger.error(e, `Couldn't transform file ${file.id}`);
				readStream.unpipe(transformer);
			});

			await storage.location(file.storage).write(assetFilename, readStream.pipe(transformer), type);

			return {
				stream: await storage.location(file.storage).read(assetFilename, range),
				stat: await storage.location(file.storage).stat(assetFilename),
				file,
			};
		} else {
			const readStream = await storage.location(file.storage).read(file.filename_disk, range);
			const stat = await storage.location(file.storage).stat(file.filename_disk);
			return { stream: readStream, file, stat };
		}
	}
}

const getAssetSuffix = (transforms: Transformation[]) => {
	if (Object.keys(transforms).length === 0) return '';
	return `__${hash(transforms)}`;
};
