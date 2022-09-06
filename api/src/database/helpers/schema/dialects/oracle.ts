import type { KNEX_TYPES } from '@directus/shared/constants';
import { Options, SchemaHelper } from '../types.js';

export class SchemaHelperOracle extends SchemaHelper {
	override async changeToType(
		table: string,
		column: string,
		type: typeof KNEX_TYPES[number],
		options: Options = {}
	): Promise<void> {
		await this.changeToTypeByCopy(table, column, type, options);
	}
}
