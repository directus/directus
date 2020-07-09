import express from 'express';
import asyncHandler from 'express-async-handler';
import Busboy from 'busboy';
import sanitizeQuery from '../middleware/sanitize-query';
import validateQuery from '../middleware/validate-query';
import * as FilesService from '../services/files';
import logger from '../logger';
import { InvalidPayloadException } from '../exceptions';
import useCollection from '../middleware/use-collection';
import * as ActivityService from '../services/activity';

const router = express.Router();

const multipartHandler = (operation: 'create' | 'update') =>
	asyncHandler(async (req, res, next) => {
		const busboy = new Busboy({ headers: req.headers });
		const savedFiles: Record<string, any> = [];

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

			if (req.user) {
				payload.uploaded_by = req.user;
			}

			fileStream.on('end', () => {
				logger.info(`File ${filename} uploaded to ${disk}.`);
			});

			try {
				if (operation === 'create') {
					const file = await FilesService.createFile(payload, fileStream, {
						ip: req.ip,
						userAgent: req.get('user-agent'),
						user: req.user,
					});

					savedFiles.push(file);
				} else {
					const file = await FilesService.updateFile(
						req.params.pk,
						payload,
						{
							ip: req.ip,
							userAgent: req.get('user-agent'),
							user: req.user,
						},
						fileStream
					);

					ActivityService.createActivity({
						action: ActivityService.Action.UPDATE,
						collection: 'directus_files',
						item: file.id,
						ip: req.ip,
						user_agent: req.get('user-agent'),
						action_by: req.user,
					});

					savedFiles.push(file);
				}
			} catch (err) {
				busboy.emit('error', err);
			}
		});

		busboy.on('error', (error: Error) => {
			next(error);
		});

		busboy.on('finish', () => {
			res.status(200).json({ data: savedFiles });
		});

		return req.pipe(busboy);
	});

router.post('/', useCollection('directus_files'), multipartHandler('create'));

router.get(
	'/',
	useCollection('directus_files'),
	sanitizeQuery,
	validateQuery,
	asyncHandler(async (req, res) => {
		const records = await FilesService.readFiles(req.sanitizedQuery);
		return res.json({ data: records });
	})
);

router.get(
	'/:pk',
	useCollection('directus_files'),
	sanitizeQuery,
	validateQuery,
	asyncHandler(async (req, res) => {
		const record = await FilesService.readFile(req.params.pk, req.sanitizedQuery);
		return res.json({ data: record });
	})
);

router.patch(
	'/:pk',
	useCollection('directus_files'),
	asyncHandler(async (req, res, next) => {
		let file: Record<string, any>;

		if (req.is('multipart/form-data')) {
			file = await multipartHandler('update')(req, res, next);
		} else {
			file = await FilesService.updateFile(req.params.pk, req.body, {
				ip: req.ip,
				userAgent: req.get('user-agent'),
				user: req.user,
			});
		}

		return res.status(200).json({ data: file });
	})
);

router.delete(
	'/:pk',
	useCollection('directus_files'),
	asyncHandler(async (req, res) => {
		await FilesService.deleteFile(req.params.pk, {
			ip: req.ip,
			userAgent: req.get('user-agent'),
			user: req.user,
		});
		return res.status(200).end();
	})
);

export default router;
