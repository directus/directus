import type {
	AbstractQueryFieldNodeNestedRelationalAnyCollection,
	AbstractQueryFieldNodeNestedUnionRelational,
	AtLeastOneElement,
} from '@directus/data';
import type {
	AbstractSqlQueryConditionNode,
	AbstractSqlQueryJoinNode,
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
	selects: AbstractSqlQuerySelectPrimitiveNode[];
};

export const getNestedUnionOne = (
	unionRelational: AbstractQueryFieldNodeNestedUnionRelational,
	tableIndex: number,
	indexGen: IndexGenerators,
): NestedUnionOneResult => {
	const parameters = [];
	const unionJoins: AbstractSqlQueryJoinNode[] = [];
	const aliasMapping: AliasMapping = [];
	const selects: AbstractSqlQuerySelectPrimitiveNode[] = [];

	const relationalFieldResult = getSelectForRelationalField(tableIndex, indexGen, unionRelational.field);
	selects.push(relationalFieldResult.select);
	aliasMapping.push(...relationalFieldResult.aliasMapping);

	for (const collection of unionRelational.collections) {
		const conditions: AbstractSqlQueryConditionNode[] = [];
		const foreignTableIndex = indexGen.table.next().value;
		const foreignTableName = collection.relational.collectionName;

		const nestedSelectResult = getNestedSelects(
			collection,
			foreignTableIndex,
			indexGen,
			collection.relational.collectionName,
		);

		aliasMapping.push(...nestedSelectResult.aliasMapping);
		selects.push(...nestedSelectResult.selects);

		const collectionCondition: AbstractSqlQueryConditionNode = {
			type: 'condition',
			negate: false,
			condition: {
				type: 'condition-string',
				operation: 'eq',
				target: {
					type: 'json',
					columnName: unionRelational.field,
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
	foreignTableName: string,
) {
	const aliasMapping: AliasMapping = [];
	const selects: AbstractSqlQuerySelectPrimitiveNode[] = [];

	for (const nestedField of c.fields) {
		const newColIndex = indexGen.column.next().value;
		if (nestedField.type !== 'primitive') throw new Error('functions in a2o not yet supported');

		aliasMapping.push({
			type: 'nested',
			alias: foreignTableName,
			children: [{ type: 'root', alias: nestedField.alias, columnIndex: newColIndex }],
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
): { select: AbstractSqlQuerySelectPrimitiveNode; aliasMapping: AliasMapping } {
	const jsonColumnIndex = indexGen.column.next().value;

	return {
		select: {
			type: 'primitive',
			tableIndex,
			columnName: relationalField,
			columnIndex: jsonColumnIndex,
		},
		aliasMapping: [
			{
				type: 'root',
				alias: relationalField,
				columnIndex: jsonColumnIndex,
			},
		],
	};
}
