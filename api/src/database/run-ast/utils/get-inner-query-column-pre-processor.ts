import { applyCaseWhen } from './apply-case-when.js';
import { getNodeAlias } from './get-field-alias.js';
import type { FieldNode, FunctionFieldNode, M2ONode, O2MNode } from '../../../types/index.js';
import type { AliasMap } from '../../../utils/get-column-path.js';
import type { Filter, Permission, SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';

export function getInnerQueryColumnPreProcessor(
	knex: Knex,
	schema: SchemaOverview,
	table: string,
	cases: Filter[],
	permissions: Permission[],
	aliasMap: AliasMap,
	aliasPrefix: string,
) {
	return function (fieldNode: FieldNode | FunctionFieldNode | M2ONode | O2MNode): Knex.Raw<string> | null {
		const alias = getNodeAlias(fieldNode);

		if (fieldNode.whenCase && fieldNode.whenCase.length > 0) {
			const columnCases: Filter[] = [];

			for (const index of fieldNode.whenCase) {
				columnCases.push(cases[index]!);
			}

			// Don't pass in the alias as we need to wrap the whole case/when in a count() an alias that
			const caseWhen = applyCaseWhen(
				{
					column: knex.raw(1),
					columnCases,
					aliasMap,
					cases,
					table,
					permissions,
				},
				{ knex, schema },
			);

			return knex.raw('COUNT(??) AS ??', [caseWhen, `${aliasPrefix}_${alias}`]);
		}

		return null;
	};
}
