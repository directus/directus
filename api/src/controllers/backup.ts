import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import DatabaseBackupService from '../services/backup';
import { DatabaseNotFoundException } from '../exceptions';
import { PassThrough } from 'stream';

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

		const fs = require('fs');
		res.attachment(path.basename(fileName));
		//should probably compress this file?
		res.set('Content-Type', 'application/octet-stream');
		const stream = fs.createReadStream(fileName);

		stream.on('end', () => {
			stream.pipe(res);
		});
		stream.on('error', function (err: string) {
			throw new DatabaseNotFoundException(err);
		});

		return next();
	})
);

export default router;
