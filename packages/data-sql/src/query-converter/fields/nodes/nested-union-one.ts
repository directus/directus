import type { AbstractQueryFieldNodeNestedUnionRelational, AtLeastOneElement } from '@directus/data';
import type {
	AbstractSqlQueryConditionNode,
	AbstractSqlQueryJoinNode,
	AbstractSqlQuerySelectPrimitiveNode,
	AliasMapping,
	ParameterTypes,
} from '../../../types/index.js';
import type { IndexGenerators } from '../../utils/create-index-generators.js';

export type NestedUnionOneResult = {
	joins: AbstractSqlQueryJoinNode[];
	parameters: ParameterTypes[];
	aliasMapping: AliasMapping;
	select: AbstractSqlQuerySelectPrimitiveNode;
};

export const getNestedUnionOne = (
	unionRelational: AbstractQueryFieldNodeNestedUnionRelational,
	tableIndex: number,
	indexGen: IndexGenerators,
): NestedUnionOneResult => {
	const parameters = [];
	const unionJoins: AbstractSqlQueryJoinNode[] = [];
	const aliasMapping: AliasMapping = [];

	for (const collection of unionRelational.collections) {
		const conditions: AbstractSqlQueryConditionNode[] = [];
		const foreignTableIndex = indexGen.table.next().value;
		const foreignTableName = collection.relational.collectionName;

		const collectionCondition: AbstractSqlQueryConditionNode = {
			type: 'condition',
			negate: false,
			condition: {
				type: 'condition-string',
				operation: 'eq',
				target: {
					type: 'json',
					columnName: unionRelational.field,
					tableIndex: foreignTableIndex,
					path: [indexGen.parameter.next().value],
				},
				compareTo: {
					type: 'value',
					parameterIndex: indexGen.parameter.next().value,
				},
			},
		};

		parameters.push('foreignCollection', foreignTableName);
		conditions.push(collectionCondition);

		for (const idField of collection.relational.fields) {
			const collectionCondition: AbstractSqlQueryConditionNode = {
				type: 'condition',
				negate: false,
				condition: {
					type: 'condition-field',
					operation: 'eq',
					target: {
						type: 'json',
						columnName: unionRelational.field,
						tableIndex,
						path: [indexGen.parameter.next().value],
					},
					compareTo: {
						type: 'primitive',
						tableIndex: foreignTableIndex,
						columnName: idField.name,
					},
				},
			};

			parameters.push('foreignKey');
			conditions.push(collectionCondition);
		}

		const join: AbstractSqlQueryJoinNode = {
			type: 'join',
			tableName: foreignTableName,
			tableIndex: foreignTableIndex,
			on: {
				type: 'logical',
				negate: false,
				operator: 'and',
				childNodes: conditions as AtLeastOneElement<AbstractSqlQueryConditionNode>,
			},
		};

		unionJoins.push(join);
	}

	const jsonColumnIndex = indexGen.column.next().value;

	const select: AbstractSqlQuerySelectPrimitiveNode = {
		type: 'primitive',
		tableIndex: tableIndex,
		columnName: unionRelational.field,
		columnIndex: jsonColumnIndex,
	};

	aliasMapping.push({
		type: 'root',
		alias: unionRelational.field,
		columnIndex: jsonColumnIndex,
	});

	return {
		joins: unionJoins,
		parameters,
		select,
		aliasMapping,
	};
};
