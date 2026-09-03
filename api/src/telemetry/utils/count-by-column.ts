import type { Knex } from 'knex';
import type { CountMetric } from '../types/report.js';

/**
 * Count rows in `table` grouped by `column`, keyed by value.
 *
 * Values outside `known` are folded into a single `custom` bucket, so a column that can hold
 * extension supplied or operator supplied values cannot leak them or grow the payload unboundedly.
 * Every known value is present in the result, at zero when unused.
 */
export async function countByColumn(
	db: Knex,
	table: string,
	column: string,
	known: readonly string[],
): Promise<Record<string, CountMetric>> {
	const rows = await db(table).select(column).count<Array<Record<string, string>>>({ count: '*' }).groupBy(column);

	const result: Record<string, CountMetric> = { custom: { count: 0 } };

	for (const value of known) {
		result[value] = { count: 0 };
	}

	for (const row of rows) {
		const value = row[column];
		const count = Number(row['count'] ?? 0);
		const key = value !== null && value !== undefined && known.includes(value) ? value : 'custom';
		result[key] = { count: result[key]!.count + count };
	}

	return result;
}
