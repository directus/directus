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
				const { Sqlite } = require('@shagital/db-dumper');
				Sqlite.create().setDbName(env.DB_FILENAME).dumpToFile('dump.sql');

			case 'pg':
				const { PostgreSql } = require('@shagital/db-dumper');
				PostgreSql.create()
					.setDbName(env.DB_NAME)
					.setUserName(env.DB_USERNAME)
					.setPassword(env.DB_PASSWORD)
					.dumpToFile('dump.sql');

			default:
				return 'dump.sql';
		}
	}

	async cleanUp() {
		//this is needed as lots of exports only support export to local
		const fs = require('fs');
		const delFile = 'dump.sql';

		try {
			if (fs.existsSync(delFile)) {
				//file exists

				fs.unlinkSync(delFile);
			}
		} catch (err) {
			throw new DatabaseNotFoundException('Cleanup failed');
		}
	}
}
