import database from '../database';
import { Accountability, AbstractServiceOptions } from '../types';
import { DatabaseNotFoundException, ForbiddenException } from '../exceptions';
import env from '../env';

export default class DatabaseBackupService {
	accountability: Accountability | null;

	constructor(options?: AbstractServiceOptions) {
		this.accountability = options?.accountability || null;
	}

	async exportDb() {
		if (this.accountability?.admin !== true) {
			throw new ForbiddenException();
		}

		switch (env.DB_CLIENT) {
			case 'sqlite3':
				const { Sqlite } = require('@shagital/db-dumper');
				Sqlite.create().setDbName(env.DB_FILENAME).dumpToFile('dump.sql');

			case 'pg':
				const { PostgreSql } = require('@shagital/db-dumper');
				PostgreSql.create()
					.setDbName(env.DB_NAME)
					.setUserName(env.DB_USER)
					.setPassword(env.DB_PASSWORD)
					.dumpToFile('dump.sql');

			case 'mysql':
				const { MySql } = require('@shagital/db-dumper');
				MySql.create()
					.setDbName(env.DB_NAME)
					.setUserName(env.DB_USER)
					.setPassword(env.DB_PASSWORD)
					.dumpToFile('dump.sql');

			default:
				return 'nope.sql';
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
