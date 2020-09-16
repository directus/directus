import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import DatabaseBackupService from '../services/backup';
import { DatabaseNotFoundException } from '../exceptions';

const router = Router();

router.get(
	'/',
	asyncHandler(async (req, res, next) => {
		const dbService = new DatabaseBackupService({ accountability: req.accountability });
		const fileName = await dbService.exportDb();

		const path = require('path');
		if (fileName === 'none') {
			throw new DatabaseNotFoundException('Database not defined in env file');
		}

		if (fileName === 'error') {
			throw new DatabaseNotFoundException('Error generating backup');
		}

		res.attachment(path.basename(fileName));
		//should probably compress this file?
		res.set('Content-Type', 'application/octet-stream');
		const fs = require('fs');
		const stream = fs.createReadStream(fileName);

		stream.on('finish', () => {
			stream.pipe(res);
		});
		stream.on('error', function (err: string) {
			throw new DatabaseNotFoundException(err);
		});

		return next();
	})
);

export default router;
