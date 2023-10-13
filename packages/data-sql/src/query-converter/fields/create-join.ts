import type { AbstractQueryFieldNodeRelationalManyToOne } from '@directus/data';
import type { AbstractSqlQueryConditionNode, AbstractSqlQueryLogicalNode } from '../../types/index.js';
import type { AbstractSqlQueryJoinNode } from '../../types/index.js';

export const createJoin = (
	currentCollection: string,
	relationalField: AbstractQueryFieldNodeRelationalManyToOne,
	externalCollectionAlias: string,
	fieldAlias?: string
): AbstractSqlQueryJoinNode => {
	let on: AbstractSqlQueryLogicalNode | AbstractSqlQueryConditionNode;

	if (relationalField.join.current.fields.length > 1) {
		on = {
			type: 'logical',
			operator: 'and',
			negate: false,
			childNodes: relationalField.join.current.fields.map((currentField, index) => {
				const externalField = relationalField.join.external.fields[index];

				if (!externalField) {
					throw new Error(`Missing related foreign key join column for current context column "${currentField}"`);
				}

				return getJoinCondition(currentCollection, currentField, externalCollectionAlias, externalField);
			}),
		};
	} else {
		on = getJoinCondition(
			currentCollection,
			relationalField.join.current.fields[0],
			externalCollectionAlias,
			relationalField.join.external.fields[0]
		);
	}

	const result: AbstractSqlQueryJoinNode = {
		type: 'join',
		table: relationalField.join.external.collection,
		as: externalCollectionAlias,
		on,
	};

	if (fieldAlias) {
		result.alias = fieldAlias;
	}

	return result;
};

function getJoinCondition(
	table1: string,
	column1: string,
	table2: string,
	column2: string
): AbstractSqlQueryConditionNode {
	return {
		type: 'condition',
		negate: false,
		condition: {
			type: 'condition-field',
			target: {
				type: 'primitive',
				table: table1,
				column: column1,
			},
			operation: 'eq',
			compareTo: {
				type: 'primitive',
				table: table2,
				column: column2,
			},
		},
	};
}
