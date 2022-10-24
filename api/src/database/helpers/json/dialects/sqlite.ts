import { JsonHelper } from '../types';
// import { Knex } from 'knex';
// import { JsonFieldNode } from '../../../../types';

/**
 * To support first-level array queries consistently we will need to get to a query like:

WITH xyz AS (
    SELECT jason.id, json_group_array(json_extract(value, "$.test")) as X
    FROM jason, json_each(jason.data, "$")
    GROUP BY jason.id
)
select jason.id, xyz.X
from jason
join xyz ON xyz.id = jason.id;
 */
/**
 * To support nested array queries consistently the above needs to be extended to:

WITH xyz AS (
    SELECT jason.id, json_group_array(json_extract(K.value, "$.b")) as X
    FROM jason, json_each(jason.data, "$") J, json_each(J.value, "$.a") K
    GROUP BY jason.id
)
select jason.id, xyz.X
from jason
join xyz ON xyz.id = jason.id;
 */
// Can't imagine these queries are as performant as the other engines

export class JsonHelperSQLite extends JsonHelper {
	jsonColumn(table: string, column: string, path: string, alias: string) {
		return this.knex.raw(this.knex.jsonExtract(`${table}.${column}`, path, alias, false));
	}
	// jsonQuery(table: string, query: Knex.QueryBuilder, fields: JsonFieldNode[]) {
	// 	// if (fields.length === 0) return query;
	// 	// for (const field of fields) {
	// 	// 	if (field.queryPath.includes('[*]')) {
	// 	// 		query = query
	// 	// 			.select(this.knex.jsonExtract('T.value', '$.test', field.fieldKey, false))
	// 	// 			.from(this.knex.raw('??, json_each(??, ?) as T', [table, `${table}.${field.name}`, '$']));
	// 	// 	} else {
	// 	// 		query = query.select(this.knex.jsonExtract(`${table}.${field.name}`, field.queryPath, field.fieldKey, false));
	// 	// 	}
	// 	// }
	// 	// console.log(query.toQuery());
	// 	return query;
	// }
}

// function processJsonPath(path: string) {
//     if (!path.includes('[*]')) return path;

// }
