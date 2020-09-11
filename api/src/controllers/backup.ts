import { Router } from 'express';
import archiver from 'archiver';
import asyncHandler from 'express-async-handler';
import DatabaseBackupService from '../services/backup';

const router = Router();

router.get(
	'/',
	asyncHandler(async (req, res, next) => {
		const dbService = new DatabaseBackupService({ accountability: req.accountability });
		const fs = require('fs');

		const archive = archiver('zip');

		archive.append(fs.createReadStream(await dbService.exportDb()), { name: 'backup.back' });

		archive.finalize();
		res.attachment('backup.zip');
		archive.pipe(res);

		return next();
	})
);

export default router;
