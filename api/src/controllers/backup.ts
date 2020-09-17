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
		const stat = fs.statSync(resolveBackup);
		await dbService.exportDb();
		res.attachment(backupName);

		res.set('Content-Type', 'application/octet-stream');
		res.set('content-length', stat.size);
		const stream = fs.createReadStream(resolveBackup, 'utf8');

		stream.on('open', () => {
			stream.pipe(res);
		});

		stream.on('error', (error: Error) => {
			throw new DatabaseNotFoundException(error.message);
			return next();
		});

		//await dbService.cleanUp(resolveBackup);
	})
);

export default router;
