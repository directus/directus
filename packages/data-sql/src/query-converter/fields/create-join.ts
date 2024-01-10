import type { AbstractQueryFieldNodeNestedRelationalMany, AtLeastOneElement } from '@directus/data';
import type {
	AbstractSqlQueryConditionNode,
	AbstractSqlQueryJoinNode,
	AbstractSqlQueryLogicalNode,
} from '../../types/index.js';

export const createJoin = (
	currentCollection: string,
	relationalField: AbstractQueryFieldNodeNestedRelationalMany,
	externalCollectionAlias: string,
): AbstractSqlQueryJoinNode => {
	let on: AbstractSqlQueryLogicalNode | AbstractSqlQueryConditionNode;

	if (relationalField.local.fields.length > 1) {
		on = {
			type: 'logical',
			operator: 'and',
			negate: false,
			childNodes: relationalField.local.fields.map((currentField, index) => {
				const externalField = relationalField.foreign.fields[index];

				if (!externalField) {
					throw new Error(`Missing related foreign key join column for current context column "${currentField}"`);
				}

				return getJoinCondition(currentCollection, currentField, externalCollectionAlias, externalField);
			}) as AtLeastOneElement<AbstractSqlQueryConditionNode>,
		};
	} else {
		on = getJoinCondition(
			currentCollection,
			relationalField.local.fields[0],
			externalCollectionAlias,
			relationalField.foreign.fields[0],
		);
	}

	const result: AbstractSqlQueryJoinNode = {
		type: 'join',
		table: relationalField.foreign.collection,
		as: externalCollectionAlias,
		on,
	};

	return result;
};

function getJoinCondition(
	table1: string,
	column1: string,
	table2: string,
	column2: string,
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
