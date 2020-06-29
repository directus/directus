import express from 'express';
import asyncHandler from 'express-async-handler';
import Busboy from 'busboy';
import sanitizeQuery from '../middleware/sanitize-query';
import validateQuery from '../middleware/validate-query';
import * as FilesService from '../services/files';
import logger from '../logger';
import { InvalidPayloadException } from '../exceptions';

const router = express.Router();

const multipartHandler = (operation: 'create' | 'update') =>
	asyncHandler(async (req, res, next) => {
		const busboy = new Busboy({ headers: req.headers });

		/**
		 * The order of the fields in multipart/form-data is important. We require that all fields
		 * are provided _before_ the files. This allows us to set the storage location, and create
		 * the row in directus_files async during the upload of the actual file.
		 */

		let disk: string;
		let payload: Record<string, any> = {};

		busboy.on('field', (fieldname, val) => {
			if (fieldname === 'storage') {
				disk = val;
			}

			payload[fieldname] = val;
		});

		busboy.on('file', async (fieldname, fileStream, filename, encoding, mimetype) => {
			if (!disk) {
				return busboy.emit('error', new InvalidPayloadException('No storage provided.'));
			}

			payload = {
				...payload,
				filename_disk: filename,
				filename_download: filename,
				type: mimetype,
			};

			fileStream.on('end', () => {
				logger.info(`File ${filename} uploaded to ${disk}.`);
			});

			try {
				if (operation === 'create') {
					await FilesService.createFile(payload, fileStream);
				} else {
					await FilesService.updateFile(req.params.pk, payload, fileStream);
				}
			} catch (err) {
				busboy.emit('error', err);
			}
		});

		busboy.on('error', (error: Error) => {
			next(error);
		});

		busboy.on('finish', () => {
			res.status(200).end();
		});

		return req.pipe(busboy);
	});

router.post('/', multipartHandler('create'));

router.get(
	'/',
	sanitizeQuery,
	validateQuery,
	asyncHandler(async (req, res) => {
		const records = await FilesService.readFiles(res.locals.query);
		return res.json({ data: records });
	})
);

router.get(
	'/:pk',
	sanitizeQuery,
	validateQuery,
	asyncHandler(async (req, res) => {
		const record = await FilesService.readFile(req.params.pk, res.locals.query);
		return res.json({ data: record });
	})
);

router.patch(
	'/:pk',
	asyncHandler(async (req, res, next) => {
		if (req.is('multipart/form-data')) {
			await multipartHandler('update')(req, res, next);
		} else {
			await FilesService.updateFile(req.params.pk, req.body);
		}

		return res.status(200).end();
	})
);

router.delete(
	'/:pk',
	asyncHandler(async (req, res) => {
		await FilesService.deleteFile(req.params.pk);
		return res.status(200).end();
	})
);

export default router;
