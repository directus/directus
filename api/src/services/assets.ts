import type { Readable } from 'node:stream';
import path from 'path';
import { useEnv } from '@directus/env';
import {
	ForbiddenError,
	IllegalAssetTransformationError,
	InvalidPayloadError,
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
import { contentType, extension } from 'mime-types';
import hash from 'object-hash';
import sharp from 'sharp';
import { SUPPORTED_IMAGE_TRANSFORM_FORMATS } from '../constants.js';
import getDatabase from '../database/index.js';
import { useLogger } from '../logger/index.js';
import { validateItemAccess } from '../permissions/modules/validate-access/lib/validate-item-access.js';
import { getStorage } from '../storage/index.js';
import { getMilliseconds } from '../utils/get-milliseconds.js';
import { isValidUuid } from '../utils/is-valid-uuid.js';
import * as TransformationUtils from '../utils/transformations.js';
import { NameDeduper } from './assets/name-deduper.js';
import { getSharpInstance } from './files/lib/get-sharp-instance.js';
import { FilesService } from './files.js';
import { FoldersService } from './folders.js';

const env = useEnv();
const logger = useLogger();

export class AssetsService {
	knex: Knex;
	accountability: Accountability | null;
	schema: SchemaOverview;
	sudoFilesService: FilesService;

	constructor(options: AbstractServiceOptions) {
		this.knex = options.knex || getDatabase();
		this.accountability = options.accountability || null;
		this.schema = options.schema;
		this.sudoFilesService = new FilesService({ ...options, accountability: null });
	}

	private sanitizeFields(file: File, allowedFields: string[]): Partial<File> {
		if (allowedFields.includes('*')) return file;

		const bypassFields: (keyof File)[] = ['type', 'filesize'];
		const fieldsToKeep = new Set<string>([...allowedFields, ...bypassFields]);
		const filteredFile: Partial<File> = {};

		for (const field of fieldsToKeep) {
			if (field in file) {
				(filteredFile as Record<string, unknown>)[field] = file[field as keyof File];
			}
		}

		return filteredFile;
	}

	private async appendFileToArchive(
		archive: archiver.Archiver,
		file: Pick<File, 'id' | 'folder' | 'filename_download'>,
		deduper: NameDeduper,
		folders: Map<string, string> | undefined,
	) {
		const storage = await getStorage();

		const fullFile = await this.sudoFilesService.readOne(file.id, {
			fields: ['id', 'storage', 'filename_disk', 'filename_download', 'modified_on', 'type'],
		});

		const exists = await storage.location(fullFile.storage).exists(fullFile.filename_disk);
		if (!exists) throw new ForbiddenError();

		const version = fullFile.modified_on ? (new Date(fullFile.modified_on).getTime() / 1000).toFixed() : undefined;
		const assetStream = await storage.location(fullFile.storage).read(fullFile.filename_disk, { version });
		const fileExtension = path.extname(fullFile.filename_download) || (fullFile.type && '.' + extension(fullFile.type)) || '';
		const dedupedFileName = deduper.add(file.filename_download, { group: file.folder, fallback: fullFile.id + fileExtension });
		const folderName = file.folder ? folders?.get(file.folder) : undefined;

		archive.append(assetStream, { name: dedupedFileName, prefix: folderName });
	}

	private zip(options: { folders?: Map<string, string>; files: Pick<File, 'id' | 'folder' | 'filename_download'>[] }) {
		if (options.files.length === 0) {
			throw new InvalidPayloadError({ reason: 'No files found in the selected folders tree' });
		}

		const archive = archiver('zip');

		const complete = async () => {
			const deduper = new NameDeduper();

			for (const file of options.files) {
				await this.appendFileToArchive(archive, file, deduper, options.folders);
			}

			for (const [, folder] of options.folders ?? []) {
				archive.append('', { name: folder + '/' });
			}

			await archive.finalize();
		};

		return { archive, complete };
	}

	async zipFiles(files: string[]) {
		const filesService = new FilesService({
			schema: this.schema,
			knex: this.knex,
			accountability: this.accountability,
		});

		const filesToZip = await filesService.readByQuery({
			filter: { id: { _in: files } },
			limit: -1,
		});

		return this.zip({
			files: filesToZip.map((file) => ({
				id: file['id'],
				folder: file['folder'],
				filename_download: file['filename_download'],
			})),
		});
	}

	async zipFolder(root: string) {
		const foldersService = new FoldersService({
			schema: this.schema,
			knex: this.knex,
			accountability: this.accountability,
		});

		const folderTree = await foldersService.buildTree(root);

		const filesService = new FilesService({
			schema: this.schema,
			knex: this.knex,
			accountability: this.accountability,
		});

		const filesToZip = await filesService.readByQuery({
			filter: { folder: { _in: Array.from(folderTree.keys()) } },
			limit: -1,
		});

		const { archive, complete } = this.zip({
			folders: folderTree,
			files: filesToZip.map((file) => ({
				id: file['id'],
				folder: file['folder'],
				filename_download: file['filename_download'],
			})),
		});

		return { archive, complete, metadata: { name: folderTree.get(root) } };
	}

	private async resolveAllowedFields(id: string, systemPublicKeys: string[]): Promise<string[]> {
		if (systemPublicKeys.includes(id) || !this.accountability || this.accountability.admin === true) {
			return ['*'];
		}

		const { allowedRootFields, accessAllowed } = await validateItemAccess(
			{
				accountability: this.accountability,
				action: 'read',
				collection: 'directus_files',
				primaryKeys: [id],
				returnAllowedRootFields: true,
			},
			{ knex: this.knex, schema: this.schema },
		);

		if (!accessAllowed) {
			throw new ForbiddenError({
				reason: `You don't have permission to perform "read" for collection "directus_files" or it does not exist.`,
			});
		}

		return allowedRootFields;
	}

	private normalizeRange(range: Range, filesize: number): void {
		const lastByte = filesize - 1;

		if (range.end) {
			if (range.start === undefined) {
				range.start = filesize - range.end;
				range.end = lastByte;
			}

			if (range.end >= filesize) {
				range.end = lastByte;
			}
		}

		if (range.start) {
			if (range.end === undefined) range.end = lastByte;
			if (range.start < 0) range.start = 0;
		}
	}

	private validateRange(range: Range, filesize: number): void {
		const missingRangeLimits = range.start === undefined && range.end === undefined;
		const endBeforeStart = range.start !== undefined && range.end !== undefined && range.end <= range.start;
		const startOverflow = range.start !== undefined && range.start >= filesize;
		const endUnderflow = range.end !== undefined && range.end <= 0;

		if (missingRangeLimits || endBeforeStart || startOverflow || endUnderflow) {
			throw new RangeNotSatisfiableError({ range });
		}
	}

	private async transformAndCacheAsset(
		file: File,
		assetFilename: string,
		transforms: Transformation[],
		type: string,
		range: Range | undefined,
		version: string | undefined,
	): Promise<void> {
		const storage = await getStorage();
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
			throw new ServiceUnavailableError({ service: 'files', reason: 'Server too busy' });
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
			}

			throw error;
		}
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

		const systemPublicKeys: string[] = Object.values(publicSettings || {});

		if (!isValidUuid(id)) throw new ForbiddenError();

		const allowedFields = await this.resolveAllowedFields(id, systemPublicKeys);
		const file = (await this.sudoFilesService.readOne(id, { limit: 1 })) as File;

		const exists = await storage.location(file.storage).exists(file.filename_disk);
		if (!exists) throw new ForbiddenError();

		if (range) {
			this.validateRange(range, file.filesize);
			this.normalizeRange(range, file.filesize);
		}

		const type = file.type;
		const transforms = transformation ? TransformationUtils.resolvePreset(transformation, file) : [];
		const modifiedOn = file.modified_on ? new Date(file.modified_on) : undefined;
		const version = modifiedOn ? (modifiedOn.getTime() / 1000).toFixed() : undefined;

		const shouldTransform = type && transforms.length > 0 && SUPPORTED_IMAGE_TRANSFORM_FORMATS.includes(type);

		if (!shouldTransform) {
			const assetStream = () => storage.location(file.storage).read(file.filename_disk, { range, version });
			const stat = await storage.location(file.storage).stat(file.filename_disk);
			return {
				stream: deferStream ? assetStream : await assetStream(),
				file: this.sanitizeFields(file, allowedFields),
				stat,
			};
		}

		const maybeNewFormat = TransformationUtils.maybeExtractFormat(transforms);

		const assetFilename =
			path.basename(file.filename_disk, path.extname(file.filename_disk)) +
			getAssetSuffix(transforms) +
			(maybeNewFormat ? `.${maybeNewFormat}` : path.extname(file.filename_disk));

		if (maybeNewFormat) {
			file.type = contentType(assetFilename) || null;
		}

		const assetExists = await storage.location(file.storage).exists(assetFilename);

		if (assetExists) {
			const assetStream = () => storage.location(file.storage).read(assetFilename, { range });
			return {
				stream: deferStream ? assetStream : await assetStream(),
				file: this.sanitizeFields(file, allowedFields),
				stat: await storage.location(file.storage).stat(assetFilename),
			};
		}

		await this.transformAndCacheAsset(file, assetFilename, transforms, type, range, version);

		const assetStream = () => storage.location(file.storage).read(assetFilename, { range, version });

		return {
			stream: deferStream ? assetStream : await assetStream(),
			stat: await storage.location(file.storage).stat(assetFilename),
			file: this.sanitizeFields(file, allowedFields),
		};
	}
}

const getAssetSuffix = (transforms: Transformation[]) => {
	if (Object.keys(transforms).length === 0) return '';
	return `__${hash(transforms)}`;
};;
