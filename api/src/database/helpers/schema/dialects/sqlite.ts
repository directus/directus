import { SchemaHelper } from '../types';

export class SchemaHelperSQLite extends SchemaHelper {
	async getForeignCheckStatus(): Promise<boolean> {
		return (await this.knex.raw('PRAGMA foreign_keys'))[0].foreign_keys === 1;
	}

	async disableForeignCheck(): Promise<void> {
		await this.knex.raw('PRAGMA foreign_keys = OFF');
	}

	async enableForeignCheck(): Promise<void> {
		await this.knex.raw('PRAGMA foreign_keys = ON');
	}
}
