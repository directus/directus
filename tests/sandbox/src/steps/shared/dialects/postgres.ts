import type { Knex } from 'knex';
import { SharedHelper } from '../types.js';

/** Postgres has native template databases, so no snapshot files are needed */
export class SharedHelperPostgres extends SharedHelper {
	readonly port = 5432;

	async createUser(user: string, password: string, name: string) {
		await this.query(async (knex) => {
			await knex.raw(`CREATE USER "${user}" WITH SUPERUSER PASSWORD '${password}'`);
			await knex.raw(`ALTER DATABASE "${name}" OWNER TO "${user}"`);
		});
	}

	protected override async createDatabase(knex: Knex, name: string) {
		// The postgis image provides a template with postgis already installed
		const postgis = await knex.raw(`SELECT 1 FROM pg_database WHERE datname = 'template_postgis'`);
		await knex.raw(`CREATE DATABASE "${name}"${postgis.rows.length > 0 ? ' TEMPLATE template_postgis' : ''}`);
	}

	protected override async dropDatabase(knex: Knex, name: string) {
		await knex.raw(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`);
	}

	override async hasTemplate(template: string) {
		return this.query(async (knex) => {
			const result = await knex.raw(`SELECT 1 FROM pg_database WHERE datname = '${template}' AND datistemplate`);
			return result.rows.length > 0;
		});
	}

	override async removeTemplates() {
		await this.query(async (knex) => {
			const result = await knex.raw(`SELECT datname FROM pg_database WHERE datname LIKE 'sandbox\\_template\\_%'`);

			for (const { datname } of result.rows) {
				await knex.raw(`ALTER DATABASE "${datname}" IS_TEMPLATE false`);
				await knex.raw(`DROP DATABASE "${datname}" WITH (FORCE)`);
			}
		});
	}

	protected override async saveTemplate(template: string) {
		await this.query((knex) => knex.raw(`ALTER DATABASE "${template}" IS_TEMPLATE true`));
	}

	protected override async restore(template: string, name: string) {
		await this.query((knex) => knex.raw(`CREATE DATABASE "${name}" TEMPLATE "${template}"`));
	}
}
