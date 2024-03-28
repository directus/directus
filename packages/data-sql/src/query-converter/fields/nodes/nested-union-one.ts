import type {
	AbstractQueryFieldNodeNestedRelationalAnyCollection,
	AbstractQueryFieldNodeNestedUnionOne,
	AtLeastOneElement,
} from '@directus/data';
import type {
	A2oChild,
	AbstractSqlQueryConditionNode,
	AbstractSqlQueryJoinNode,
	AbstractSqlQuerySelectJsonNode,
	AbstractSqlQuerySelectNode,
	AbstractSqlQuerySelectPrimitiveNode,
	AliasMapping,
	ParameterTypes,
} from '../../../types/index.js';
import type { IndexGenerators } from '../../utils/create-index-generators.js';
import { createPrimitiveSelect } from './primitive-select.js';

export type NestedUnionOneResult = {
	joins: AbstractSqlQueryJoinNode[];
	parameters: ParameterTypes[];
	aliasMapping: AliasMapping;
	selects: AbstractSqlQuerySelectNode[];
};

export const getNestedUnionOne = (
	node: AbstractQueryFieldNodeNestedUnionOne,
	tableIndex: number,
	indexGen: IndexGenerators,
): NestedUnionOneResult => {
	const parameters = [];
	const unionJoins: AbstractSqlQueryJoinNode[] = [];
	const aliasMapping: AliasMapping = [];
	const selects: AbstractSqlQuerySelectNode[] = [];

	const relationalFieldResult = getSelectForRelationalField(tableIndex, indexGen, node.nesting.field);
	selects.push(relationalFieldResult.json);
	parameters.push(relationalFieldResult.parameter);

	const children: A2oChild[] = [];

	for (const collection of node.nesting.collections) {
		const conditions: AbstractSqlQueryConditionNode[] = [];
		const foreignTableIndex = indexGen.table.next().value;
		const foreignTableName = collection.relational.collectionName;
		const nestedSelectResult = getNestedSelects(collection, foreignTableIndex, indexGen);
		selects.push(...nestedSelectResult.selects);

		children.push({
			collection: foreignTableName,
			mapping: nestedSelectResult.aliasMapping,
		});

		const collectionCondition: AbstractSqlQueryConditionNode = {
			type: 'condition',
			negate: false,
			condition: {
				type: 'condition-string',
				operation: 'eq',
				target: {
					type: 'json',
					columnName: node.nesting.field,
					tableIndex,
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

		for (const [fkFieldIdx, idField] of collection.relational.fields.entries()) {
			const collectionCondition: AbstractSqlQueryConditionNode = {
				type: 'condition',
				negate: false,
				condition: {
					type: 'condition-field',
					operation: 'eq',
					target: {
						type: 'json',
						columnName: node.nesting.field,
						tableIndex,
						path: [indexGen.parameter.next().value, fkFieldIdx],
						pathIsIndex: true,
						dataType: idField.type,
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

	aliasMapping.push({ type: 'nested-a2o', children, alias: node.alias });

	return {
		joins: unionJoins,
		parameters,
		selects,
		aliasMapping,
	};
};

function getNestedSelects(
	c: AbstractQueryFieldNodeNestedRelationalAnyCollection,
	foreignTableIndex: number,
	indexGen: IndexGenerators,
) {
	const aliasMapping: AliasMapping = [];
	const selects: AbstractSqlQuerySelectPrimitiveNode[] = [];

	for (const nestedField of c.fields) {
		if (nestedField.type !== 'primitive') {
			throw new Error('functions in a2o not yet supported');
		}

		const newColIndex = indexGen.column.next().value;

		aliasMapping.push({
			type: 'root',
			alias: nestedField.alias,
			columnIndex: newColIndex,
		});

		const select = createPrimitiveSelect(foreignTableIndex, nestedField.field, newColIndex);
		selects.push(select);
	}

	return { selects, aliasMapping };
}

function getSelectForRelationalField(
	tableIndex: number,
	indexGen: IndexGenerators,
	relationalField: string,
): {
	json: AbstractSqlQuerySelectJsonNode;
	parameter: ParameterTypes;
} {
	const jsonColumnIndex = indexGen.column.next().value;

	return {
		json: {
			type: 'json',
			tableIndex,
			columnIndex: jsonColumnIndex,
			columnName: relationalField,
			path: [indexGen.parameter.next().value],
		},
		parameter: 'foreignCollection',
	};
}
