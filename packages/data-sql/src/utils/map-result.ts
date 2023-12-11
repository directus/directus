/**
 * This unit takes care of transforming the response from the database into into a nested JSON object.
 *
 * @remarks
 * A SQL database returns the result as a two dimensional table, where the actual data are the rows and the columns specify the fields.
 * Such result is a flat Javascript object but we want to return a nested object which maps the realtionships form the database into a nested structure of an object.
 *
 * @example
 * Let's say we have the two collections articles and authors and we want to query all articles with all data about the author as well.
 * This would be the SQL query:
 *
 * ```sql
 * select * from articles join authors on authors.id = articles.author;
 * ```
 * The following is a chunk from an example response from the database:
 * ```json
 * {
 *   "id": 1,
 *   "status": "published",
 *   "author": 1,
 *   "title": "some news",
 *   "name": "jan"
 * },
 * ```
 * The first four rows were stored in the articles table, the last two in the authors table.
 * But what we want to return to the user is the following:
 * ```json
 * {
 *   "id": 1,
 *   "status": "published",
 *   "title": "some news",
 *   "author": {
 *      "id": 1,
 *   	"name": "jan"
 * 		},
 * },
 * ```
 * That's what this unit is for.
 *
 * @module
 */
import type { AliasMapping } from '../types/abstract-sql.js';

export function mapResult(
	aliasMapping: AliasMapping,
	rootRow: Record<string, unknown>,
	subResult: Record<string, unknown>[][],
): Record<string, unknown> {
	const result: Record<string, unknown> = {};

	for (const aliasObject of aliasMapping) {
		if (aliasObject.type === 'root') {
			result[aliasObject.alias] = rootRow[aliasObject.column];
		} else if (aliasObject.type === 'sub') {
			result[aliasObject.alias] = subResult[aliasObject.index];
		} else {
			result[aliasObject.alias] = mapResult(aliasObject.children, rootRow, subResult);
		}
	}

	return result;
}
