import express from 'express';
import asyncHandler from 'express-async-handler';
import Busboy from 'busboy';
import sanitizeQuery from '../middleware/sanitize-query';
import FilesService from '../services/files';
import MetaService from '../services/meta';
import useCollection from '../middleware/use-collection';
import { File, PrimaryKey } from '../types';
import path from 'path';
import formatTitle from '@directus/format-title';
import env from '../env';

const router = express.Router();

router.use(useCollection('directus_files'));

const multipartHandler = asyncHandler(async (req, res, next) => {
	if (req.is('multipart/form-data') === false) return next();

	const busboy = new Busboy({ headers: req.headers });
	const savedFiles: PrimaryKey[] = [];
	const service = new FilesService({ accountability: req.accountability });

	/**
	 * The order of the fields in multipart/form-data is important. We require that all fields
	 * are provided _before_ the files. This allows us to set the storage location, and create
	 * the row in directus_files async during the upload of the actual file.
	 */

	let disk: string = (env.STORAGE_LOCATIONS as string).split(',')[0].trim();
	let payload: Partial<File> = {};
	let fileCount = 0;

	busboy.on('field', (fieldname: keyof File, val) => {
		if (fieldname === 'storage') {
			disk = val;
		}

		payload[fieldname] = val;
	});

	busboy.on('file', async (fieldname, fileStream, filename, encoding, mimetype) => {
		fileCount++;

		if (!payload.title) {
			payload.title = formatTitle(path.parse(filename).name);
		}

		if (req.accountability?.user) {
			payload.uploaded_by = req.accountability.user;
		}

		const payloadWithRequiredFields: Partial<File> & {
			filename_download: string;
			type: string;
			storage: string;
		} = {
			...payload,
			filename_download: filename,
			type: mimetype,
			storage: payload.storage || disk,
		};

		const primaryKey = await service.upload(fileStream, payloadWithRequiredFields);
		savedFiles.push(primaryKey);
		tryDone();
	});

	busboy.on('error', (error: Error) => {
		next(error);
	});

	busboy.on('finish', () => {
		tryDone();
	});

	req.pipe(busboy);

	function tryDone() {
		if (savedFiles.length === fileCount) {
			res.locals.savedFiles = savedFiles;
			return next();
		}
	}
});

router.post(
	'/',
	sanitizeQuery,
	multipartHandler,
	asyncHandler(async (req, res) => {
		const service = new FilesService({ accountability: req.accountability });
		let keys: PrimaryKey | PrimaryKey[] = [];

		if (req.is('multipart/form-data')) {
			keys = res.locals.savedFiles;
		} else {
			// @TODO is this ever used in real life? Wouldn't you always upload a file on create?
			keys = await service.create(req.body);
		}

		const record = await service.readByKey(keys as any, req.sanitizedQuery);

		return res.json({ data: res.locals.savedFiles.length === 1 ? record[0] : record || null });
	})
);

router.get(
	'/',
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		const service = new FilesService({ accountability: req.accountability });
		const metaService = new MetaService({ accountability: req.accountability });

		const records = await service.readByQuery(req.sanitizedQuery);
		const meta = await metaService.getMetaForQuery(req.collection, req.sanitizedQuery);

		return res.json({ data: records || null, meta });
	})
);

router.get(
	'/:pk',
	sanitizeQuery,
	asyncHandler(async (req, res) => {
		const keys = req.params.pk.includes(',') ? req.params.pk.split(',') : req.params.pk;
		const service = new FilesService({ accountability: req.accountability });
		const record = await service.readByKey(keys as any, req.sanitizedQuery);
		return res.json({ data: record || null });
	})
);

router.patch(
	'/:pk',
	sanitizeQuery,
	multipartHandler,
	asyncHandler(async (req, res) => {
		const service = new FilesService({ accountability: req.accountability });
		let keys: PrimaryKey | PrimaryKey[] = [];

		if (req.is('multipart/form-data')) {
			keys = res.locals.savedFiles;
		} else {
			keys = req.params.pk.includes(',') ? req.params.pk.split(',') : req.params.pk;
			await service.update(req.body, keys as any);
		}

		const record = await service.readByKey(keys as any, req.sanitizedQuery);
		return res.json({ data: record || null });
	})
);

router.delete(
	'/:pk',
	asyncHandler(async (req, res) => {
		const keys = req.params.pk.includes(',') ? req.params.pk.split(',') : req.params.pk;
		const service = new FilesService({ accountability: req.accountability });
		await service.delete(keys as any);
		return res.status(200).end();
	})
);

export default router;
