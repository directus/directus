import type {
	AbstractQueryFieldNodeNestedMany,
	AbstractQueryFieldNodeRelationalOneToMany,
	AtLeastOneElement,
} from '@directus/data';
import type {
	AbstractSqlClauses,
	AbstractSqlNestedMany,
	AbstractSqlQueryConditionNode,
	AbstractSqlQueryWhereNode,
	ParameterTypes,
} from '../../index.js';
import type { FieldConversionResult } from './fields.js';
import { convertModifiers } from '../modifiers/modifiers.js';

/**
 * Converts a nested many node from the abstract query into a function which creates abstract SQL.
 * The generated function will be called later on, when the root query is executed and the result is available.
 *
 * @param fieldMeta - the relational meta data from the abstract query
 * @param nestedOutput - the result of the nested field conversion
 * @param idxGenerator - the generator used to increase the parameter indices
 * @param alias - the alias of the foreign collection
 * @returns A function to create a query with and information about the relation
 */
export function getNestedMany(
	field: AbstractQueryFieldNodeNestedMany,
	nestedOutput: FieldConversionResult,
	idxGenerator: Generator<number, number, number>
): AbstractSqlNestedMany {
	// it cannot be anything else than o2m at this point.
	const fieldMeta = field.meta as AbstractQueryFieldNodeRelationalOneToMany;

	const relationalConditions = fieldMeta.join.foreign.fields.map((f) =>
		getRelationCondition(fieldMeta.join.foreign.collection, f, idxGenerator)
	) as AtLeastOneElement<AbstractSqlQueryWhereNode>;

	let mandatoryCondition: AbstractSqlQueryWhereNode;

	if (relationalConditions.length > 1) {
		mandatoryCondition = {
			type: 'logical',
			operator: 'and',
			negate: false,
			childNodes: relationalConditions,
		};
	} else {
		mandatoryCondition = relationalConditions[0];
	}

	const params: ParameterTypes[] = [];

	let clauses: AbstractSqlClauses = {
		select: nestedOutput.clauses.select,
		from: fieldMeta.join.foreign.collection,
	};

	if (field.modifiers) {
		const c = convertModifiers(field.modifiers, fieldMeta.join.foreign.collection, idxGenerator);
		clauses = { ...clauses, ...c.clauses };
		params.push(...c.parameters);
	}

	if (clauses.where) {
		if (clauses.where.type === 'logical') {
			clauses.where.childNodes.push(mandatoryCondition);
		} else {
			clauses.where = {
				type: 'logical',
				operator: 'and',
				negate: false,
				childNodes: [mandatoryCondition, clauses.where],
			};
		}
	} else {
		clauses.where = mandatoryCondition;
	}

	return {
		queryGenerator: (identifierValues) => ({
			clauses,
			parameters: [...nestedOutput.parameters, ...identifierValues, ...params],
			aliasMapping: nestedOutput.aliasMapping,
			nestedManys: nestedOutput.nestedManys,
		}),
		localJoinFields: fieldMeta.join.local.fields,
		foreignJoinFields: fieldMeta.join.foreign.fields,
		alias: fieldMeta.join.foreign.collection,
	};
}

/**
 * Create the condition to match the foreign key with the local key
 *
 * @param table
 * @param column
 * @param idxGenerator
 * @returns
 */
function getRelationCondition(
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
