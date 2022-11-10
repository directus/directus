import { Knex } from 'knex';
import { JsonHelperDefault } from './default';

/**
 * We may want a fallback to support wildcard queries (will be super slow unfortunately)
 */
export class JsonHelperMySQL extends JsonHelperDefault {
	static isSupported({ parsed, full }: { parsed: number[]; full: string }): boolean {
		if (parsed.length === 0) return false;
		const [major, minor] = parsed;
		if (/MariaDB/i.test(full)) {
			if (major == 10 && minor >= 2) return true;
			return false;
		}
		if (major === 8) return true; // 8.x has good support
		if (major === 5 && minor >= 7) return true; // 5.7 or higher
		return false;
	}
	preProcess(dbQuery: Knex.QueryBuilder, table: string): void {
		dbQuery
			.select(
				this.nodes.map((node) => {
					const q = this.knex.raw('?', [node.jsonPath]).toQuery();
					return this.knex.raw(`??.??->${q} as ??`, [table, node.name, node.fieldKey]);
				})
			)
			.from(table);
	}
}
