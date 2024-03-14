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
	subResults: Record<string, unknown>[][],
	columnIndexToIdentifier: (columnIndex: number) => string,
): Record<string, unknown> {
	const result: Record<string, unknown> = {};

	for (const aliasObject of aliasMapping) {
		if (aliasObject.type === 'root') {
			result[aliasObject.alias] = rootRow[columnIndexToIdentifier(aliasObject.columnIndex)];
		} else if (aliasObject.type === 'sub') {
			result[aliasObject.alias] = subResults[aliasObject.index];
		} else if (aliasObject.type === 'nested') {
			result[aliasObject.alias] = mapResult(aliasObject.children, rootRow, subResults, columnIndexToIdentifier);
		} else if (aliasObject.type === 'nested-a2o') {
			const foreignCollection = rootRow[columnIndexToIdentifier(99999)];
			const childObjIndex = aliasObject.children.findIndex((i) => i.collection === foreignCollection);
			const specificChild = aliasObject.children[childObjIndex];
			if (specificChild === undefined) throw new Error();
			result[aliasObject.alias] = mapResult(specificChild.mapping, rootRow, subResults, columnIndexToIdentifier);
		}
	}

	return result;
}
