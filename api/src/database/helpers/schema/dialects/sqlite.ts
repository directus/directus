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

	override async preColumnChange(): Promise<boolean> {
		const foreignCheckStatus = (await this.knex.raw('PRAGMA foreign_keys'))[0].foreign_keys === 1;

		if (foreignCheckStatus) {
			await this.knex.raw('PRAGMA foreign_keys = OFF');
		}

		return foreignCheckStatus;
	}

	override async postColumnChange(): Promise<void> {
		await this.knex.raw('PRAGMA foreign_keys = ON');
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

	/**
	 * better-sqlite3 binds every JS number through `sqlite3_bind_double`, since only BigInt maps to
	 * `sqlite3_bind_int64`. In a column with TEXT affinity, SQLite then stringifies the double, so an
	 * integer primary key written into a varchar column lands as `"41.0"` instead of `"41"`.
	 *
	 * That silently breaks everything that stores an id as a string: the a2o junction `item` column
	 * (`item = CAST(??.?? AS CHAR(255))` no longer matches), and the `item` columns on activity,
	 * revisions, comments, notifications, shares and versions.
	 *
	 * Hand better-sqlite3 a BigInt whenever a binding is an integer, so those ids keep their exact
	 * form. Anything outside the safe integer range stays on the double path, since it can't
	 * round-trip through a JS number anyway. Reads are unaffected: `safeIntegers` governs how values
	 * come out of SQLite and stays off, so integers still read back as numbers.
	 */
	override prepBindings(bindings: unknown): unknown {
		// A query without bindings hands us `undefined`, and named bindings arrive as an object
		if (!Array.isArray(bindings)) return bindings;

		return bindings.map((binding) =>
			typeof binding === 'number' && Number.isSafeInteger(binding) ? BigInt(binding) : binding,
		);
	}
}
