import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import DatabaseBackupService from '../services/backup';
import { DatabaseNotFoundException, InvalidCredentialsException } from '../exceptions';
import env from '../env';

const router = Router();

router.get(
	'/',
	asyncHandler(async (req, res, next) => {
		let backup = env.DB_BACKUP;
		const dbService = new DatabaseBackupService({ accountability: req.accountability });
		const path = require('path');
		const fs = require('fs');

		const resolveBackup = path.normalize(path.resolve(backup));
		await dbService.exportDb();

		res.attachment(path.basename(backup));

		try {
			fs.accessSync(resolveBackup, fs.constants.R_OK | fs.constants.W_OK);
			console.log('can read/write');
		} catch (err) {
			console.error('no access!');
		}

		res.set('Content-Type', 'application/octet-stream');

		console.log(process.cwd());
		console.log(resolveBackup);
		const stream = fs.createReadStream(resolveBackup, 'utf8');

		stream.on('error', (error: string) => {
			throw new DatabaseNotFoundException(error);
		});

		stream.on('end', () => {
			stream.pipe(res);
		});

		await dbService.cleanUp(backup);

		return next();
	})
);

export default router;
