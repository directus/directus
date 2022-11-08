import { SchemaHelper } from '../types';

export class SchemaHelperSQLite extends SchemaHelper {
	async preColumnChange(): Promise<boolean> {
		const foreignCheckStatus = (await this.knex.raw('PRAGMA foreign_keys'))[0].foreign_keys === 1;

		if (foreignCheckStatus) {
			await this.knex.raw('PRAGMA foreign_keys = OFF');
		}

		return foreignCheckStatus;
	}

	async postColumnChange(): Promise<void> {
		await this.knex.raw('PRAGMA foreign_keys = ON');
	}

	async getVersion(): Promise<{ parsed: string; full: string }> {
		const version = await this.knex.select(this.knex.raw('sqlite_version() as version'));
		return { parsed: version[0]['version'], full: version[0]['version'] };
	}
}
