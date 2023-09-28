/**
 * This unit takes care of transforming the response from the database into into a proper JSON object.
 * An SQL database returns the result as a table, where the actual data are the rows and the columns specify the fields.
 * This gets converted by the JS/TS drivers into an object, where the properties are the columns and the values the according value in the row.
 * Therefore we always receive an flat object which we in turn want to transform into a nested object, when another table is joined.
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
 * @packageDocumentation
 */
export * from './expand.js';
export * from './create-unique-alias.js';
