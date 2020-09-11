import database from '../database';
import Knex from 'knex';

import { Accountability, AbstractServiceOptions } from '../types';
import { DatabaseNotFoundException } from '../exceptions';
import env from '../env';

export default class DatabaseBackupService {
	knex: Knex;
	accountability: Accountability | null;

	constructor(options?: AbstractServiceOptions) {
		this.knex = options?.knex || database;
		this.accountability = options?.accountability || null;
	}

	async exportDb() {
		//need to put check for admin user
		//importing knex for the time being but probably won't be needed.

		switch (env.DB_CLIENT) {
			case 'sqlite3':
				const sqlite3 = require('sqlite3');
				const db = new sqlite3.Database(env.DB_FILENAME);
				const backup = db.backup('backup.back');

				if (backup.completed) {
					return 'backup.back';
				}
				if (backup.failed) {
					throw new DatabaseNotFoundException('Database backup failed');
				}

			default:
				return 'backup.back';
		}
	}

	async cleanUp() {
		//this is needed as lots of exports only support export to local
		const fs = require('fs');
		const delFile = 'backup.back';

		try {
			fs.unlinkSync(delFile);
		} catch (err) {
			throw new DatabaseNotFoundException('Cleanup failed');
		}
	}
}
