import type { Knex } from 'knex';
import { type AdminEnv, SharedHelper } from '../types.js';

/** Templates are stored as database backups */
export class SharedHelperMSSQL extends SharedHelper {
	readonly port = 1433;
	protected override readonly templateFolder = '/var/opt/mssql/data';

	override async start() {
		await super.start();
		// `CREATE DATABASE` requires an exclusive lock on model, the default database of the sandbox
		this.admin = { ...this.admin, DB_DATABASE: 'master' } as AdminEnv;
	}

	async createUser(user: string, password: string, name: string) {
		await this.query(async (knex) => {
			await knex.raw(
				`CREATE LOGIN [${user}] WITH PASSWORD = '${password}', DEFAULT_DATABASE = [${name}], CHECK_POLICY = OFF`,
			);

			await knex.raw(`ALTER SERVER ROLE sysadmin ADD MEMBER [${user}]`);
		});
	}

	protected override async dropDatabase(knex: Knex, name: string) {
		await knex.raw(`IF DB_ID('${name}') IS NOT NULL BEGIN
			ALTER DATABASE [${name}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
			DROP DATABASE [${name}];
		END`);
	}

	protected override async dropUser(knex: Knex, user: string) {
		await knex.raw(`IF SUSER_ID('${user}') IS NOT NULL DROP LOGIN [${user}]`);
	}

	protected override async backup(template: string) {
		await this.query((knex) =>
			knex.raw(`BACKUP DATABASE [${template}] TO DISK = '${this.templateFile(template, 'bak')}' WITH INIT, COPY_ONLY`),
		);
	}

	protected override async restore(template: string, name: string) {
		const folder = this.templateFolder;

		// Logical file names default to the database name the backup was taken from
		await this.query((knex) =>
			knex.raw(`RESTORE DATABASE [${name}] FROM DISK = '${this.templateFile(template, 'bak')}' WITH
				MOVE '${template}' TO '${folder}/${name}.mdf',
				MOVE '${template}_log' TO '${folder}/${name}_log.ldf'`),
		);
	}
}
