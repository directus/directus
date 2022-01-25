import {
	FieldNode,
	FragmentDefinitionNode,
	GraphQLObjectType,
	GraphQLResolveInfo,
	GraphQLScalarType,
	GraphQLSchema,
	SelectionNode,
} from 'graphql';

const gqlScalarType = new GraphQLScalarType({
	name: 'name',
	serialize(value) {
		return value % 2 === 1 ? value : null;
	},
});
const gqlObjectType = new GraphQLObjectType({ name: 'objectName', fields: { source: { type: gqlScalarType } } });
const fragments = {
	string: {
		kind: 'FragmentDefinition',
		name: { kind: 'Name', value: 'Fragment' },
		typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Hello' } },
		selectionSet: {
			kind: 'SelectionSet',
			selections: [] as SelectionNode[],
		},
	},
} as Record<string, FragmentDefinitionNode>;

const fieldNodes = [
	{
		kind: 'Field',
		name: { kind: 'Name', value: 'date' },
		selectionSet: {
			kind: 'SelectionSet',
			selections: [
				{
					kind: 'Field',
					name: { kind: 'Name', value: 'date' },
				},
			],
		},
	},
] as FieldNode[];
export const info = {
	fieldName: 'authors',
	fieldNodes: fieldNodes,
	returnType: gqlScalarType,
	parentType: gqlObjectType,
	path: {
		prev: undefined,
		key: 'name',
		typename: undefined,
	},
	schema: new GraphQLSchema({}),
	fragments,
	rootValue: '',
	operation: {
		kind: 'OperationDefinition',
		operation: 'query',
		selectionSet: {
			kind: 'SelectionSet',
			selections: [{ kind: 'Field', name: { kind: 'Name', value: 'An Operation field' } }],
		},
	},
	variableValues: {},
} as GraphQLResolveInfo;

export const aggregationInfo = {
	fieldName: 'authors_aggregated',
	fieldNodes: fieldNodes,
	returnType: gqlScalarType,
	parentType: gqlObjectType,
	path: {
		prev: undefined,
		key: 'name',
		typename: undefined,
	},
	schema: new GraphQLSchema({}),
	fragments,
	rootValue: '',
	operation: {
		kind: 'OperationDefinition',
		operation: 'query',
		selectionSet: {
			kind: 'SelectionSet',
			selections: [{ kind: 'Field', name: { kind: 'Name', value: 'An Operation field' } }],
		},
	},
	variableValues: {},
} as GraphQLResolveInfo;

export const noSelections = {
	fieldName: 'name',
	fieldNodes: [],
	returnType: gqlScalarType,
	parentType: gqlObjectType,
	path: {
		prev: undefined,
		key: 'name',
		typename: undefined,
	},
	schema: new GraphQLSchema({}),
	fragments,
	rootValue: undefined,
	operation: {
		kind: 'OperationDefinition',
		operation: 'query',
		selectionSet: {
			kind: 'SelectionSet',
			selections: [{ kind: 'Field', name: { kind: 'Name', value: 'An Operation field' } }],
		},
	},
	variableValues: {},
} as GraphQLResolveInfo;
