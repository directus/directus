import type { Filter, SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import type { FieldNode, FunctionFieldNode, M2ONode } from '../../../types/ast.js';
import { applyFilter } from '../../../utils/apply-query.js';
import type { AliasMap } from '../../../utils/get-column-path.js';
import { getColumn } from '../../../utils/get-column.js';
import { parseFilterKey } from '../../../utils/parse-filter-key.js';
import { getHelpers } from '../../helpers/index.js';

export function getColumnPreprocessor(
	knex: Knex,
	schema: SchemaOverview,
	table: string,
	cases: Filter[],
	aliasMap: AliasMap,
) {
	const helpers = getHelpers(knex);

	return function (fieldNode: FieldNode | FunctionFieldNode | M2ONode): Knex.Raw<string> {
		let alias = fieldNode.name;

		if (fieldNode.name !== fieldNode.fieldKey) {
			alias = fieldNode.fieldKey;
		}

		let field;

		if (fieldNode.type === 'field' || fieldNode.type === 'functionField') {
			const { fieldName } = parseFilterKey(fieldNode.name);
			field = schema.collections[table]!.fields[fieldName];
		} else {
			field = schema.collections[fieldNode.relation.collection]!.fields[fieldNode.relation.field];
		}

		let column = getColumn(knex, table, fieldNode.name, alias, schema);

		if (field?.type?.startsWith('geometry')) {
			column = helpers.st.asText(table, field.field);
		}

		if (fieldNode.type === 'functionField') {
			column = getColumn(knex, table, fieldNode.name, alias, schema, { query: fieldNode.query });
		}

		if (fieldNode.whenCase && fieldNode.whenCase.length > 0) {
			const fieldCases: Filter[] = [];

			for (const index of fieldNode.whenCase) {
				fieldCases.push(cases[index]!);
			}

			/**
			 * TODO wrap `column` in `case when (filter) then `column` else null end`
			 */

			const caseQuery = knex.queryBuilder();
			applyFilter(knex, schema, caseQuery, { _or: fieldCases }, table, aliasMap, cases);

         // This is a hack just to try things out

         const caseSql = caseQuery.toQuery().split('where')[1]!;

         // Definitely not production ready TODO
         column = knex.raw(`(case when ${caseSql} then ${column.toQuery()} else null end) as ${alias}`);

			/**
			 * ^^^
			 * This is an interesting approach to reusing the existing applyFilter logic, but that
			 * relies on Knex' `.where()` methods, which implicitly adds the "select * where " prefix
			 * Wondering if we should try regex the where clause bit, or come up with a plan B. I'd
			 * really rather not reinvent the whole .where internal logic if we don't have to
			 */
		}

		return column;
	};
}
