import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import DatabaseBackupService from '../services/backup';
import { DatabaseNotFoundException, InvalidCredentialsException } from '../exceptions';
import env from '../env';

const router = Router();

router.get(
	'/',
	asyncHandler(async (req, res, next) => {
		const backupPath = env.DB_BACKUP_PATH;
		const backupName = env.DB_BACKUP_NAME;
		const dbService = new DatabaseBackupService({ accountability: req.accountability });
		const path = require('path');
		const fs = require('fs');

		const resolveBackup = path.normalize(path.resolve(`${backupPath}/${backupName}`));
		await dbService.exportDb();

		res.attachment(backupName);

		res.set('Content-Type', 'application/octet-stream');
		const stream = fs.createReadStream(resolveBackup, 'utf8');

		stream.on('error', (error: Error) => {
			throw new DatabaseNotFoundException(error.message);
		});

		stream.on('end', () => {
			stream.pipe(res);
		});

		await dbService.cleanUp(resolveBackup);

		return next();
	})
);

export default router;
