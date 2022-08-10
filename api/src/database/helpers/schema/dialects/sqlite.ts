import { SchemaHelper } from '../types';

export class SchemaHelperSQLite extends SchemaHelper {
	async preColumnDelete(): Promise<boolean> {
		const foreignCheckStatus = (await this.knex.raw('PRAGMA foreign_keys'))[0].foreign_keys === 1;

		if (foreignCheckStatus) {
			await this.knex.raw('PRAGMA foreign_keys = OFF');
		}

		return foreignCheckStatus;
	}

	async postColumnDelete(): Promise<void> {
		await this.knex.raw('PRAGMA foreign_keys = ON');
	}
}
