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
	

		const backupPath = env.DB_BACKUP_PATH;
		const backupName= 'backup.zip'
		const dbService = new DatabaseBackupService({ accountability: req.accountability });
		const zipper = require('zip-local');

		// export the database 

		await dbService.exportDb();

		const fullPath = path.join(process.cwd(), backupPath);
		const backUp = path.join(fullPath, backupName)
		await dbService.cleanUp(backUp);
		// zip the files in the dir 
		zipper.sync.zip(fullPath).compress().save(backUp);

		const stats = fs.statSync(backUp);
	
		res.set('Content-Type', 'application/zip');
		res.set('content-length', `${stats.size}`);
		res.attachment(backupName);
		const stream = fs.createReadStream(backUp, 'utf8');

		stream.on('end', () => {
			stream.pipe(res);
		});

		stream.on('error', (error: Error) => {
			throw new DatabaseNotFoundException(error.message);
		});

	

		return next();
	})
);


export default router;
