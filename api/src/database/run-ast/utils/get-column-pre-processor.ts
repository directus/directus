import type { Filter, Permission, SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import type { FieldNode, FunctionFieldNode, M2ONode } from '../../../types/ast.js';
import type { AliasMap } from '../../../utils/get-column-path.js';
import { parseFilterKey } from '../../../utils/parse-filter-key.js';
import { getHelpers } from '../../helpers/index.js';
import { joinFilterWithCases } from '../lib/apply-query/join-filter-with-cases.js';
import { applyCaseWhen } from './apply-case-when.js';
import { getColumn } from './get-column.js';
import { getNodeAlias } from './get-field-alias.js';

interface NodePreProcessOptions {
	/** Don't assign an alias to the column but instead return the column as is */
	noAlias?: boolean;
}

export function getColumnPreprocessor(
	knex: Knex,
	schema: SchemaOverview,
	table: string,
	cases: Filter[],
	permissions: Permission[],
	aliasMap: AliasMap,
	permissionsOnly?: boolean,
) {
	const helpers = getHelpers(knex);

	return function (
		fieldNode: FieldNode | FunctionFieldNode | M2ONode,
		options?: NodePreProcessOptions,
	): Knex.Raw<string> {
		// Don't assign an alias to the column expression if the field has a whenCase
		// (since the alias will be assigned in applyCaseWhen) or if the noAlias option is set
		const hasWhenCase = fieldNode.whenCase && fieldNode.whenCase.length > 0;
		const noAlias = options?.noAlias || hasWhenCase;
		const alias = getNodeAlias(fieldNode);

		const rawColumnAlias = noAlias ? false : alias;

		let field;

		if (fieldNode.type === 'field' || fieldNode.type === 'functionField') {
			const { fieldName } = parseFilterKey(fieldNode.name);
			field = schema.collections[table]!.fields[fieldName];
		} else {
			field = schema.collections[fieldNode.relation.collection]!.fields[fieldNode.relation.field];
		}

		let column;

		if (permissionsOnly) {
			if (noAlias) {
				column = knex.raw(1);
			} else {
				column = knex.raw('1 as ??', [alias]);
			}
		} else if (field?.type?.startsWith('geometry')) {
			column = helpers.st.asText(table, field.field, rawColumnAlias);
		} else if (fieldNode.type === 'functionField') {
			// Include the field cases in the functionField query filter
			column = getColumn(knex, table, fieldNode.name, rawColumnAlias, schema, {
				query: {
					...fieldNode.query,
					filter: joinFilterWithCases(fieldNode.query.filter, fieldNode.cases),
				},
				permissions,
				cases: fieldNode.cases,
			});
		} else {
			column = getColumn(knex, table, fieldNode.name, rawColumnAlias, schema, { coalesce: fieldNode.coalesce });
		}

		if (hasWhenCase) {
			const columnCases: Filter[] = [];

			for (const index of fieldNode.whenCase) {
				columnCases.push(cases[index]!);
			}

			column = applyCaseWhen(
				{
					column,
					columnCases,
					aliasMap,
					cases,
					table,
					alias,
					permissions,
				},
				{ knex, schema },
			);
		}

		return column;
	};
}
