import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import DatabaseBackupService from '../services/dbbackup';
import { DatabaseNotFoundException, InvalidCredentialsException } from '../exceptions';
import fs from 'fs';
import path from 'path';
import env from '../env';

const router = Router();

router.get(
	'/backup',
	asyncHandler(async (req, res, next) => {
		if (!req.accountability?.user || !req.accountability?.role) {
			throw new InvalidCredentialsException();
		}

		const backupPath = env.DB_BACKUP_PATH;
		const backupName= 'backup.zip'
		const dbService = new DatabaseBackupService({ accountability: req.accountability });
		const zipper = require('zip-local');

		// export the database 

		await dbService.exportDb();

		const fullPath = path.join(process.cwd(), backupPath);

		// zip the files
		zipper.sync.zip(fullPath).compress().save("backup.zip");

		const backup = path.join(fullPath, backupName)
		const stats = fs.statSync(backup);
	
		res.attachment('backup.');

		res.set('Content-Type', 'application/zip');
		res.set('content-length', `${stats.size}`);
		const stream = fs.createReadStream(backup, 'utf8');

		stream.on('open', () => {
			stream.pipe(res);
		});

		stream.on('error', (error: Error) => {
			throw new DatabaseNotFoundException(error.message);
		});

		await dbService.cleanUp(backup);
	})
);


export default router;
