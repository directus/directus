import type { SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import type { FieldNode, FunctionFieldNode, M2ONode } from '../../../types/ast.js';
import { getColumn } from '../../../utils/get-column.js';
import { parseFilterKey } from '../../../utils/parse-filter-key.js';
import { getHelpers } from '../../helpers/index.js';

export function getColumnPreprocessor(knex: Knex, schema: SchemaOverview, table: string) {
	const helpers = getHelpers(knex);

	return function (fieldNode: FieldNode | FunctionFieldNode | M2ONode): Knex.Raw<string> {
		let alias = undefined;

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

		if (field?.type?.startsWith('geometry')) {
			return helpers.st.asText(table, field.field);
		}

		if (fieldNode.type === 'functionField') {
			return getColumn(knex, table, fieldNode.name, alias, schema, { query: fieldNode.query });
		}

		return getColumn(knex, table, fieldNode.name, alias, schema);
	};
}
