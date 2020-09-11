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
		if (fileName === 'none') {
			throw new DatabaseNotFoundException('Database not defined in env file');
		}
		await dbService.cleanUp(fileName);
		const fs = require('fs');
		res.attachment(fileName);
		//should probably compress this file?
		res.set('Content-Type', 'application/octet-stream');

		const stream = fs.createReadStream(fileName);

		stream.pipe(res);

		//this is needed because backup /dump methods only support local

		return next();
	})
);

export default router;
