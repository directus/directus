import { useEnv } from '@directus/env';
import {
	ForbiddenError,
	IllegalAssetTransformationError,
	InvalidQueryError,
	RangeNotSatisfiableError,
	ServiceUnavailableError,
} from '@directus/errors';
import type {
	AbstractServiceOptions,
	Accountability,
	File,
	Range,
	SchemaOverview,
	Stat,
	Transformation,
	TransformationSet,
} from '@directus/types';
import archiver from 'archiver';
import type { Knex } from 'knex';
import { clamp } from 'lodash-es';
import { contentType } from 'mime-types';
import type { Readable } from 'node:stream';
import hash from 'object-hash';
import path from 'path';
import sharp from 'sharp';
import { SUPPORTED_IMAGE_TRANSFORM_FORMATS } from '../constants.js';
import getDatabase from '../database/index.js';
import { useLogger } from '../logger/index.js';
import { validateAccess } from '../permissions/modules/validate-access/validate-access.js';
import { getStorage } from '../storage/index.js';
import { getMilliseconds } from '../utils/get-milliseconds.js';
import { isValidUuid } from '../utils/is-valid-uuid.js';
import * as TransformationUtils from '../utils/transformations.js';
import { FilesService } from './files.js';
import { getSharpInstance } from './files/lib/get-sharp-instance.js';
import { FileDeduper, type Files } from './assets/dedupe-files.js';

const env = useEnv();
const logger = useLogger();

export class AssetsService {
	knex: Knex;
	accountability: Accountability | null;
	schema: SchemaOverview;
	sudoService: FilesService;

	constructor(options: AbstractServiceOptions) {
		this.knex = options.knex || getDatabase();
		this.accountability = options.accountability || null;
		this.schema = options.schema;
		this.sudoService = new FilesService({ ...options, accountability: null });
	}

	async getFileHierarchy(rootFolder: string) {
		const fileTree = this.knex
			.withRecursive('folders', ['id', 'name', 'parent'], (qb) => {
				qb.select('id', 'name', 'parent')
					.from('directus_folders')
					.where('id', rootFolder)
					.unionAll((qb) => {
						qb.select(
							'directus_folders.id',
							this.knex.raw(`CONCAT(folders.name, '/', directus_folders.name)`),
							'directus_folders.parent',
						)
							.from('directus_folders')
							.join('folders', 'folders.id', 'directus_folders.parent');
					});
			})
			.select<{ id: string; folder: string }[]>('directus_files.id', 'folders.name as folder')
			.from('directus_files')
			.rightJoin('folders', 'folders.id', 'directus_files.folder');

		const results = await fileTree;

		return results;
	}

	async getZip(files: Files, skipUnaccessable = false) {
		const filesService = new FilesService({
			schema: this.schema,
			knex: this.knex,
			accountability: this.accountability,
		});

		const archive = archiver('zip');

		const complete = async () => {
			const fileDeduper = new FileDeduper();
			const storage = await getStorage();

			for (const { id, folder } of files) {
				if (!isValidUuid(id)) throw new ForbiddenError();
				let accessError;

				if (this.accountability) {
					try {
						await validateAccess(
							{
								accountability: this.accountability,
								action: 'read',
								collection: 'directus_files',
								primaryKeys: [id],
							},
							{ knex: this.knex, schema: this.schema },
						);
					} catch (error) {
						accessError = error;
					}

					if (!skipUnaccessable && accessError) {
						throw accessError;
					}
				}

				const file = (await filesService.readOne(id)) as File;

				const exists = await storage.location(file.storage).exists(file.filename_disk);

				if (!exists) throw new ForbiddenError();

				const version = file.modified_on ? (new Date(file.modified_on).getTime() / 1000).toFixed() : undefined;

				const assetStream = await storage.location(file.storage).read(file.filename_disk, { version });

				const name = fileDeduper.add(file.filename_download ?? file.id);

				archive.append(assetStream, { name, prefix: folder });
			}

			await archive.finalize();
		};

		return { archive, complete };
	}

	async getAsset(
		id: string,
		transformation?: TransformationSet,
		range?: Range,
		deferStream?: false,
	): Promise<{ stream: Readable; file: any; stat: Stat }>;

	async getAsset(
		id: string,
		transformation?: TransformationSet,
		range?: Range,
		deferStream?: true,
	): Promise<{ stream: () => Promise<Readable>; file: any; stat: Stat }>;

	async getAsset(
		id: string,
		transformation?: TransformationSet,
		range?: Range,
		deferStream: boolean = false,
	): Promise<{ stream: (() => Promise<Readable>) | Readable; file: any; stat: Stat }> {
		const storage = await getStorage();

		const publicSettings = await this.knex
			.select('project_logo', 'public_background', 'public_foreground', 'public_favicon')
			.from('directus_settings')
			.first();

		const systemPublicKeys = Object.values(publicSettings || {});

		/**
		 * This is a little annoying. Postgres will error out if you're trying to search in `where`
		 * with a wrong type. In case of directus_files where id is a uuid, we'll have to verify the
		 * validity of the uuid ahead of time.
		 */
		if (!isValidUuid(id)) throw new ForbiddenError();

		if (systemPublicKeys.includes(id) === false && this.accountability) {
			await validateAccess(
				{
					accountability: this.accountability,
					action: 'read',
					collection: 'directus_files',
					primaryKeys: [id],
				},
				{ knex: this.knex, schema: this.schema },
			);
		}

		const file = (await this.sudoService.readOne(id, { limit: 1 })) as File;

		const exists = await storage.location(file.storage).exists(file.filename_disk);

		if (!exists) throw new ForbiddenError();

		if (range) {
			const missingRangeLimits = range.start === undefined && range.end === undefined;
			const endBeforeStart = range.start !== undefined && range.end !== undefined && range.end <= range.start;
			const startOverflow = range.start !== undefined && range.start >= file.filesize;
			const endUnderflow = range.end !== undefined && range.end <= 0;

			if (missingRangeLimits || endBeforeStart || startOverflow || endUnderflow) {
				throw new RangeNotSatisfiableError({ range });
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
		const transforms = transformation ? TransformationUtils.resolvePreset(transformation, file) : [];

		const modifiedOn = file.modified_on ? new Date(file.modified_on) : undefined;
		const version = modifiedOn ? (modifiedOn.getTime() / 1000).toFixed() : undefined;

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
				const assetStream = () => storage.location(file.storage).read(assetFilename, { range });

				return {
					stream: deferStream ? assetStream : await assetStream(),
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
				width > (env['ASSETS_TRANSFORM_IMAGE_MAX_DIMENSION'] as number) ||
				height > (env['ASSETS_TRANSFORM_IMAGE_MAX_DIMENSION'] as number)
			) {
				logger.warn(`Image is too large to be transformed, or image size couldn't be determined.`);
				throw new IllegalAssetTransformationError({ invalidTransformations: ['width', 'height'] });
			}

			const { queue, process } = sharp.counters();

			if (queue + process > (env['ASSETS_TRANSFORM_MAX_CONCURRENT'] as number)) {
				throw new ServiceUnavailableError({
					service: 'files',
					reason: 'Server too busy',
				});
			}

			const transformer = getSharpInstance();

			transformer.timeout({
				seconds: clamp(Math.round(getMilliseconds(env['ASSETS_TRANSFORM_TIMEOUT'], 0) / 1000), 1, 3600),
			});

			if (transforms.find((transform) => transform[0] === 'rotate') === undefined) transformer.rotate();

			try {
				for (const [method, ...args] of transforms) {
					(transformer[method] as any).apply(transformer, args);
				}
			} catch (error) {
				if (error instanceof Error && error.message.startsWith('Expected')) {
					throw new InvalidQueryError({ reason: error.message });
				}

				throw error;
			}

			const readStream = await storage.location(file.storage).read(file.filename_disk, { range, version });

			readStream.on('error', (e: Error) => {
				logger.error(e, `Couldn't transform file ${file.id}`);
				readStream.unpipe(transformer);
			});

			try {
				await storage.location(file.storage).write(assetFilename, readStream.pipe(transformer), type);
			} catch (error) {
				try {
					await storage.location(file.storage).delete(assetFilename);
				} catch {
					// Ignored to prevent original error from being overwritten
				}

				if ((error as Error)?.message?.includes('timeout')) {
					throw new ServiceUnavailableError({ service: 'assets', reason: `Transformation timed out` });
				} else {
					throw error;
				}
			}

			const assetStream = () => storage.location(file.storage).read(assetFilename, { range, version });

			return {
				stream: deferStream ? assetStream : await assetStream(),
				stat: await storage.location(file.storage).stat(assetFilename),
				file,
			};
		} else {
			const assetStream = () => storage.location(file.storage).read(file.filename_disk, { range, version });
			const stat = await storage.location(file.storage).stat(file.filename_disk);
			return { stream: deferStream ? assetStream : await assetStream(), file, stat };
		}
	}
}

const getAssetSuffix = (transforms: Transformation[]) => {
	if (Object.keys(transforms).length === 0) return '';
	return `__${hash(transforms)}`;
};
