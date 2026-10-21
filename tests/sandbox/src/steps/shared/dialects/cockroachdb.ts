import type { Knex } from 'knex';
import { SharedHelper } from '../types.js';
import { getHostPort } from '../utils.js';

/** Templates are stored as backups in the external io dir of the node */
export class SharedHelperCockroachDb extends SharedHelper {
	readonly port = 26257;
	protected override readonly templateFolder = '/cockroach/extern';

	protected override async getPorts() {
		return { ...(await super.getPorts()), COCKROACH_UI: await getHostPort(this.container, 8080) };
	}

	override generatePassword() {
		// Passwords are not supported in insecure mode
		return '';
	}

	async createUser(user: string, _password: string, name: string) {
		await this.query(async (knex) => {
			await knex.raw(`CREATE USER "${user}"`);
			await knex.raw(`GRANT admin TO "${user}"`);
			await knex.raw(`ALTER DATABASE "${name}" OWNER TO "${user}"`);
		});
	}

	protected override async dropDatabase(knex: Knex, name: string) {
		await knex.raw(`DROP DATABASE IF EXISTS "${name}" CASCADE`);
	}

	protected override async backup(template: string) {
		await this.query((knex) => knex.raw(`BACKUP DATABASE "${template}" INTO 'nodelocal://1/${template}'`));
	}

	protected override async restore(template: string, name: string) {
		await this.query((knex) =>
			knex.raw(
				`RESTORE DATABASE "${template}" FROM LATEST IN 'nodelocal://1/${template}' WITH new_db_name = '${name}'`,
			),
		);
	}
}
