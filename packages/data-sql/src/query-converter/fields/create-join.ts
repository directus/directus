import type { AbstractQueryFieldNodeNestedRelationalMany, AtLeastOneElement } from '@directus/data';
import type {
	AbstractSqlQueryConditionNode,
	AbstractSqlQueryJoinNode,
	AbstractSqlQueryLogicalNode,
} from '../../types/index.js';

export const createJoin = (
	relationalField: AbstractQueryFieldNodeNestedRelationalMany,
	tableIndex: number,
	tableIndexRelational: number,
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

				return getJoinCondition(tableIndex, currentField, tableIndexRelational, externalField);
			}) as AtLeastOneElement<AbstractSqlQueryConditionNode>,
		};
	} else {
		on = getJoinCondition(
			tableIndex,
			relationalField.local.fields[0],
			tableIndexRelational,
			relationalField.foreign.fields[0],
		);
	}

	const result: AbstractSqlQueryJoinNode = {
		type: 'join',
		tableName: relationalField.foreign.collection,
		tableIndex: tableIndexRelational,
		on,
	};

	return result;
};

function getJoinCondition(
	tableIndex1: number,
	columnName1: string,
	tableIndex2: number,
	columnName2: string,
): AbstractSqlQueryConditionNode {
	return {
		type: 'condition',
		negate: false,
		condition: {
			type: 'condition-field',
			target: {
				type: 'primitive',
				tableIndex: tableIndex1,
				columnName: columnName1,
			},
			operation: 'eq',
			compareTo: {
				type: 'primitive',
				tableIndex: tableIndex2,
				columnName: columnName2,
			},
		},
	};
}
