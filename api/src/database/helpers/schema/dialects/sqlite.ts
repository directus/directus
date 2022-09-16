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
}
