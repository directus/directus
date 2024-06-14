import type { Filter, SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import type { FieldNode, FunctionFieldNode, M2ONode } from '../../../types/index.js';
import type { AliasMap } from '../../../utils/get-column-path.js';
import { applyCaseWhen } from './apply-case-when.js';

export function getInnerQueryColumnPreProcessor(
	knex: Knex,
	schema: SchemaOverview,
	table: string,
	cases: Filter[],
	aliasMap: AliasMap,
	aliasPrefix: string,
) {
	return function (fieldNode: FieldNode | FunctionFieldNode | M2ONode): Knex.Raw<string> | null {
		let alias = fieldNode.name;

		if (fieldNode.name !== fieldNode.fieldKey) {
			alias = fieldNode.fieldKey;
		}

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
				},
				{ knex, schema },
			);

			return knex.raw('COUNT(??) AS ??', [caseWhen, `${aliasPrefix}_${alias}`]);
		}

		return null;
	};
}
