import { getDefaultIndexName } from '../../../../utils/get-default-index-name.js';
import { SchemaHelper } from '../types.js';

export class SchemaHelperSQLite extends SchemaHelper {
	override generateIndexName(
		type: 'unique' | 'foreign' | 'index',
		collection: string,
		fields: string | string[],
	): string {
		return getDefaultIndexName(type, collection, fields, { maxLength: Infinity });
	}

	/**
	 * SQLite rebuilds tables for most alterations. Dropping the old table with foreign keys enabled would trigger the
	 * `ON DELETE` actions of every table referencing it. The pragma is ignored within transactions, so this has to wrap
	 * the transaction instead of running inside of it.
	 */
	override async withForeignKeysDisabled<T>(fn: () => Promise<T>): Promise<T> {
		const enabled = (await this.knex.raw('PRAGMA foreign_keys'))[0].foreign_keys === 1;

		// Already disabled, either by the user or by an outer call
		if (!enabled) return fn();

		await this.knex.raw('PRAGMA foreign_keys = OFF');

		try {
			return await fn();
		} finally {
			await this.knex.raw('PRAGMA foreign_keys = ON');
		}
	}

	override async getDatabaseSize(): Promise<number | null> {
		try {
			const result = await this.knex.raw(
				'SELECT page_count * page_size as "size" FROM pragma_page_count(), pragma_page_size();',
			);

			return result[0]?.['size'] ? Number(result[0]?.['size']) : null;
		} catch {
			return null;
		}
	}

	override addInnerSortFieldsToGroupBy() {
		// SQLite does not need any special handling for inner query sort columns
	}
}
