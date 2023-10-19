import type { AbstractQueryFieldNodeRelationalOneToMany } from '@directus/data';
import type { Result } from './fields.js';
import type { AbstractSqlNestedMany, AbstractSqlQueryConditionNode, AbstractSqlQueryWhereNode } from '../../index.js';

export function getSubQuery(
	fieldMeta: AbstractQueryFieldNodeRelationalOneToMany,
	nestedOutput: Result,
	idxGenerator: Generator<number, number, number>,
	alias: string
): AbstractSqlNestedMany {
	const where = getWhereClause(fieldMeta, idxGenerator);
	return {
		queryGenerator: (fields: [string, ...string[]]) => ({
			clauses: {
				select: nestedOutput.clauses.select,
				from: fieldMeta.join.external.collection,
				where,
			},
			parameters: [...nestedOutput.parameters, ...fields],
			aliasMapping: nestedOutput.aliasMapping,
			nestedManys: nestedOutput.nestedManys,
		}),
		alias,
	};
}

function getWhereClause(
	fieldMeta: AbstractQueryFieldNodeRelationalOneToMany,
	idxGenerator: Generator<number, number, number>
): AbstractSqlQueryWhereNode {
	let where: AbstractSqlQueryWhereNode;

	if (fieldMeta.join.current.fields.length === 1) {
		where = getCondition(fieldMeta.join.external.collection, fieldMeta.join.external.fields[0], idxGenerator);
	} else {
		where = {
			type: 'logical',
			operator: 'and',
			negate: false,
			childNodes: fieldMeta.join.current.fields.map((field) =>
				getCondition(fieldMeta.join.external.collection, field, idxGenerator)
			),
		};
	}

	return where;
}

function getCondition(
	table: string,
	column: string,
	idxGenerator: Generator<number, number, number>
): AbstractSqlQueryConditionNode {
	return {
		type: 'condition',
		condition: {
			type: 'condition-string',
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
