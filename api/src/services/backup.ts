import Knex from 'knex';
import database from '../database';
import { Accountability, AbstractServiceOptions } from '../types';
import { DatabaseNotFoundException, ForbiddenException } from '../exceptions';
import env from '../env';

//can't use knex for most of this dbbackups are bashtools and cannot
// call from .raw

export default class DatabaseBackupService {
	accountability: Accountability | null;
	knex: Knex;

	constructor(options?: AbstractServiceOptions) {
		this.accountability = options?.accountability || null;
		this.knex = options?.knex || database;
	}

	async exportDb() {
		let fileName = `${env.STORAGE_LOCAL_ROOT}dump.sql`;

		switch (env.DB_CLIENT) {
			case 'sqlite3':
				const { Sqlite } = require('@shagital/db-dumper');
				Sqlite.create().setDbName(env.DB_FILENAME).dumpToFile('dump.sql');
				break;

			case 'pg':
				const { PostgreSql } = require('@shagital/db-dumper');
				PostgreSql.create()
					.setDbName(env.DB_NAME)
					.setUserName(env.DB_USER)
					.setPassword(env.DB_PASSWORD)
					.dumpToFile('dump.sql');
				break;

			case 'mysql':
				const { MySql } = require('@shagital/db-dumper');
				MySql.create()
					.setDbName(env.DB_NAME)
					.setUserName(env.DB_USER)
					.setPassword(env.DB_PASSWORD)
					.dumpToFile('dump.sql');

				break;

			case 'oracledb':
				//need to do - thinking of best way
				const oracle = require('oracledb');
				break;

			case 'mssql':
				// need to use SQL for this

				const backup = `BACKUP DATABASE [${env.STORAGE_LOCAL_ROOT}${env.DB_DATABASE}] TO DISK = N'dump.bak' WITH NOFORMAT, NOINIT, NAME = N'SQLTestDB-Full Database Backup', SKIP, NOREWIND, NOUNLOAD,  STATS = 10 GO`;
				this.knex.raw(backup);
				fileName = 'dump.bak';
				break;

			default:
				break;
		}

		return fileName;
	}

	async cleanUp(fileName: string) {
		//this is needed as lots of exports only support export to local disk and then need to stream
		const fs = require('fs');

		try {
			if (fs.existsSync(fileName)) {
				//file exists

				fs.unlinkSync(fileName);
			}
		} catch (err) {
			throw new DatabaseNotFoundException('Cleanup failed');
		}
	}
}
