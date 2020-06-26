import express from 'express';
import asyncHandler from 'express-async-handler';
import Busboy from 'busboy';
import sanitizeQuery from '../middleware/sanitize-query';
import validateQuery from '../middleware/validate-query';
import * as FilesService from '../services/files';
import storage from '../storage';
import { Readable } from 'stream';

const router = express.Router();

router.post(
	'/',
	asyncHandler(async (req, res, next) => {
		const busboy = new Busboy({ headers: req.headers });

		/**
		 * The order of the fields in multipart/form-data is important. We require that storage is set
		 * before the file contents itself. This allows us to set and use the correct storage adapter
		 * for the file upload.
		 */

		let disk: string;

		busboy.on('field', (fieldname, val) => {
			if (fieldname === 'storage') {
				disk = val;
			}
		});

		busboy.on('file', async (fieldname, fileStream, filename, encoding, mimetype) => {
			if (!disk) {
				return busboy.emit('error', new Error('no storage provided'));
			}

			try {
				await storage.disk(disk).put(filename, fileStream as Readable);
			} catch (err) {
				busboy.emit('error', err);
			}

			fileStream.on('end', () => {
				console.log(`File ${filename} saved.`);
			});
		});

		busboy.on('error', (error: Error) => {
			next(error);
		});

		busboy.on('finish', () => {
			res.status(200).end();
		});

		return req.pipe(busboy);
	})
);

/** @TODO This needs to support multipart form-data for file uploads */
// router.post(
// 	'/',
// 	asyncHandler(async (req, res) => {
// 		const records = await FilesService.createFile(
// 			req.body,
// 			res.locals.query
// 		);
// 		return res.json({ data: records });
// 	})
// );

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
	asyncHandler(async (req, res) => {
		const records = await FilesService.updateFile(req.params.pk, req.body, res.locals.query);
		return res.json({ data: records });
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
