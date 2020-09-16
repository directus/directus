import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import DatabaseBackupService from '../services/backup';
import { DatabaseNotFoundException } from '../exceptions';
import env from '../env';

const router = Router();

router.get(
	'/',
	asyncHandler(async (req, res, next) => {
		let backup = env.DB_BACKUP;
		const dbService = new DatabaseBackupService({ accountability: req.accountability });
		const path = require('path');
		const fs = require('fs');

		const resolveBackup = path.resolve(backup);

		await dbService.cleanUp(backup);
		await dbService.exportDb();

		res.attachment(path.basename(backup));
		//should probably compress this file?
		res.set('Content-Type', 'application/octet-stream');

		console.log(resolveBackup);
		const stream = fs.createReadStream(resolveBackup);

		stream.on('error', function (err: string) {
			throw new DatabaseNotFoundException(err);
		});

		stream.on('end', () => {
			stream.pipe(res);
		});

		return next();
	})
);

export default router;
