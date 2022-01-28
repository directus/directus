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

const argNodes = [
	{
		kind: 'Field',
		name: { kind: 'Name', value: 'date' },
		arguments: [
			{
				kind: 'Argument',
				name: { kind: 'Name', value: 'id' },
				value: { kind: 'ListValue', values: [{ kind: 'StringValue', value: 'id' }] },
			},
		],
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

export const info = (table: string) =>
	({
		fieldName: table,
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
	} as GraphQLResolveInfo);

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

export const argsById = (table: string) =>
	({
		fieldName: table,
		fieldNodes: argNodes,
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
	} as GraphQLResolveInfo);

export const createManyMutation = (table: string) => {
	return {
		fieldName: `create_${table}_items`,
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
			operation: 'mutation',
			selectionSet: {
				kind: 'SelectionSet',
				selections: [{ kind: 'Field', name: { kind: 'Name', value: 'An Operation field' } }],
			},
		},
		variableValues: {},
	} as GraphQLResolveInfo;
};

export const createOneMutation = (table: string) => {
	return {
		fieldName: `create_${table}_item`,
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
			operation: 'mutation',
			selectionSet: {
				kind: 'SelectionSet',
				selections: [{ kind: 'Field', name: { kind: 'Name', value: 'An Operation field' } }],
			},
		},
		variableValues: {},
	} as GraphQLResolveInfo;
};

export const updateManyMutation = (table: string) => {
	return {
		fieldName: `update_${table}_items`,
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
			operation: 'mutation',
			selectionSet: {
				kind: 'SelectionSet',
				selections: [{ kind: 'Field', name: { kind: 'Name', value: 'An Operation field' } }],
			},
		},
		variableValues: {},
	} as GraphQLResolveInfo;
};

export const updateOneMutation = (table: string) => {
	return {
		fieldName: `update_${table}_item`,
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
			operation: 'mutation',
			selectionSet: {
				kind: 'SelectionSet',
				selections: [{ kind: 'Field', name: { kind: 'Name', value: 'An Operation field' } }],
			},
		},
		variableValues: {},
	} as GraphQLResolveInfo;
};

export const deleteManyMutation = (table: string) => {
	return {
		fieldName: `delete_${table}_items`,
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
			operation: 'mutation',
			selectionSet: {
				kind: 'SelectionSet',
				selections: [{ kind: 'Field', name: { kind: 'Name', value: 'An Operation field' } }],
			},
		},
		variableValues: {},
	} as GraphQLResolveInfo;
};

export const deleteOneMutation = (table: string) => {
	return {
		fieldName: `delete_${table}_item`,
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
			operation: 'mutation',
			selectionSet: {
				kind: 'SelectionSet',
				selections: [{ kind: 'Field', name: { kind: 'Name', value: 'An Operation field' } }],
			},
		},
		variableValues: {},
	} as GraphQLResolveInfo;
};

export const singletonMutation = (table: string) => {
	return {
		fieldName: `update_${table}`,
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
			operation: 'mutation',
			selectionSet: {
				kind: 'SelectionSet',
				selections: [{ kind: 'Field', name: { kind: 'Name', value: 'An Operation field' } }],
			},
		},
		variableValues: {},
	} as GraphQLResolveInfo;
};
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
