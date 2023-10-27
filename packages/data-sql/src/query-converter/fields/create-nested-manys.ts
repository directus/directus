import type { AbstractQueryFieldNodeRelationalOneToMany, AtLeastOneElement } from '@directus/data';
import type { AbstractSqlNestedMany, AbstractSqlQueryConditionNode, AbstractSqlQueryWhereNode } from '../../index.js';
import type { Result } from './fields.js';

export function getNestedMany(
	fieldMeta: AbstractQueryFieldNodeRelationalOneToMany,
	nestedOutput: Result,
	idxGenerator: Generator<number, number, number>,
	alias: string
): AbstractSqlNestedMany {
	const where = getWhereClause(fieldMeta, idxGenerator);

	return {
		queryGenerator: (identifierValues) => ({
			clauses: {
				select: nestedOutput.clauses.select,
				from: fieldMeta.join.foreign.collection,
				where,
			},
			parameters: [...nestedOutput.parameters, ...identifierValues],
			aliasMapping: nestedOutput.aliasMapping,
			nestedManys: nestedOutput.nestedManys,
		}),
		localJoinFields: fieldMeta.join.local.fields,
		foreignJoinFields: fieldMeta.join.foreign.fields,
		alias,
	};
}

function getWhereClause(
	fieldMeta: AbstractQueryFieldNodeRelationalOneToMany,
	idxGenerator: Generator<number, number, number>
): AbstractSqlQueryWhereNode {
	const table = fieldMeta.join.foreign.collection;

	if (fieldMeta.join.local.fields.length > 1 && fieldMeta.join.foreign.fields.length > 1) {
		return {
			type: 'logical',
			operator: 'and',
			negate: false,
			childNodes: fieldMeta.join.foreign.fields.map((field) =>
				getCondition(table, field, idxGenerator)
			) as AtLeastOneElement<AbstractSqlQueryConditionNode>,
		};
	} else {
		return getCondition(table, fieldMeta.join.foreign.fields[0], idxGenerator);
	}
}

function getCondition(
	table: string,
	column: string,
	idxGenerator: Generator<number, number, number>
): AbstractSqlQueryConditionNode {
	return {
		type: 'condition',
		condition: {
			type: 'condition-string', // could also be a condition-number, but it doesn't matter because both support 'eq'
			operation: 'eq',
			target: {
				type: 'primitive',
				table,
				column,
			},
			compareTo: {
				type: 'value',
				parameterIndex: idxGenerator.next().value,
			},
		},
		negate: false,
	};
}
