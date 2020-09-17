/**
 * Drivers needed to be installed on server
 * as most db exports use cmd line tools
 * MySQL =  mysqldump should be installed.
 * PG =  pg_dump should be installed.
 * SQLlite =  sqlite3 should be installed.
 * Oracle = Oracle database utilties should be installed
 * the path of the tool must be specified in DB_BINARY
 */
import Knex from 'knex';
import database from '../database';
import { Accountability, AbstractServiceOptions } from '../types';
import { DatabaseNotFoundException, ForbiddenException } from '../exceptions';
import env from '../env';

export default class DatabaseBackupService {
	accountability: Accountability | null;
	knex: Knex;

	constructor(options?: AbstractServiceOptions) {
		this.accountability = options?.accountability || null;
		this.knex = options?.knex || database;
	}

	async exportDb() {
		let backup = `${env.DB_BACKUP_PATH}/${env.DB_BACKUP_NAME}`;
		const { GzipCompressor } = require('@shagital/db-dumper');
		await this.cleanUp(`${backup}.gz`);

		switch (env.DB_CLIENT) {
			case 'sqlite3':
				const { Sqlite } = require('@shagital/db-dumper');
				try {
					Sqlite.create()
						.setDbName(env.DB_FILENAME)
						.setDumpBinaryPath(env.DB_BINARY)
						.useCompressor(new GzipCompressor())
						.dumpToFile(`${backup}.gz`);
				} catch (error) {
					throw new DatabaseNotFoundException(error.message);
				}

				break;

			case 'pg':
				const { PostgreSql } = require('@shagital/db-dumper');
				try {
					PostgreSql.create()
						.setDbName(env.DB_NAME)
						.setUserName(env.DB_USER)
						.setPassword(env.DB_PASSWORD)
						.setDumpBinaryPath(env.DB_BINARY)
						.useCompressor(new GzipCompressor())
						.dumpToFile(`${backup}.gz`);
				} catch (error) {
					throw new DatabaseNotFoundException(error.message);
				}
				break;

			case 'mysql':
				const { MySql } = require('@shagital/db-dumper');
				try {
					MySql.create()
						.setDbName(env.DB_NAME)
						.setUserName(env.DB_USER)
						.setPassword(env.DB_PASSWORD)
						.setDumpBinaryPath(env.DB_BINARY)
						.useCompressor(new GzipCompressor())
						.dumpToFile(`${backup}.gz`);
				} catch (error) {
					throw new DatabaseNotFoundException(error.message);
				}
				break;

			case 'oracledb':
				await this.oracleExport();

				break;

			case 'mssql':
				// need to use SQL for this

				const backupSQL = `BACKUP DATABASE [${env.DB_DATABASE}] TO DISK = N'${backup}' WITH NOFORMAT, NOINIT, NAME = N'SQLTestDB-Full Database Backup', SKIP, NOREWIND, NOUNLOAD,  STATS = 10 GO`;
				this.knex.raw(backupSQL);
				break;

			default:
				break;
		}
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

	private async oracleExport() {
		// uses tool Oracle database utilities
		// https://oracle-base.com/articles/10g/oracle-data-pump-10g
		// function only recommended for smallish oracle databases
		// if the db is large should use RMAN
		// user should have  DBA privilege, or EXP_FULL_DATABASE role . if not EXP-00023 error message will be displayed
		// also DBA must give user permission to directory like
		//  CREATE DIRECTORY  exp_schema  AS  ‘path\to\export’;

		const spawn = require('cross-spawn');

		const backupDB = `expdp ${env.DB_USER}/${env.DB_PASSWORD} full=Y directory=${env.DB_BACKUP_PATH} dumpfile=${env.DB_BACKUP_NAME}`;

		const dir = await spawn('cd', [env.DB_BINARY], (error: Error, stderr: string) => {
			if (error) throw new DatabaseNotFoundException(error.message);
			if (stderr) throw new DatabaseNotFoundException(stderr);
		});

		const backupCmd = await spawn(backupDB, (error: Error, stderr: string) => {
			if (error) throw new DatabaseNotFoundException(error.message);
			if (stderr) throw new DatabaseNotFoundException(stderr);
		});

		dir.stdout.pipe(backupCmd.stdin);
		backupCmd.stdout.pipe(process.stdout);
	}
}
