import type { Knex } from 'knex';
import { SharedHelper } from '../types.js';
import { exec } from '../utils.js';

/** Templates are stored as sql dumps */
export class SharedHelperMySQL extends SharedHelper {
	readonly port = 3306;
	protected readonly dumpCommand: string = 'mysqldump';
	protected readonly clientCommand: string = 'mysql';

	async createUser(user: string, password: string) {
		await this.query(async (knex) => {
			await knex.raw(`CREATE USER '${user}'@'%' IDENTIFIED BY '${password}'`);
			await knex.raw(`GRANT ALL PRIVILEGES ON *.* TO '${user}'@'%' WITH GRANT OPTION`);
		});
	}

	protected override async createDatabase(knex: Knex, name: string) {
		await knex.raw(`CREATE DATABASE \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
	}

	protected override async dropDatabase(knex: Knex, name: string) {
		await knex.raw(`DROP DATABASE IF EXISTS \`${name}\``);
	}

	protected override async dropUser(knex: Knex, user: string) {
		await knex.raw(`DROP USER IF EXISTS '${user}'@'%'`);
	}

	protected override async backup(template: string) {
		await this.shell(
			`${this.dumpCommand} -uroot --single-transaction ${template} > ${this.templateFile(template, 'sql')}`,
		);
	}

	protected override async restore(template: string, name: string) {
		await this.query((knex) => this.createDatabase(knex, name));
		await this.shell(`${this.clientCommand} -uroot ${name} < ${this.templateFile(template, 'sql')}`);
	}

	/** Run a shell command inside of the container, authenticated as root */
	protected async shell(command: string) {
		await exec('docker', ['exec', '-e', `MYSQL_PWD=${this.admin.DB_PASSWORD}`, this.container, 'sh', '-c', command]);
	}
}
