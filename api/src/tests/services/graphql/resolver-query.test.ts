import { ResolveQuery } from '../../../services/graphql/resolve-query';
import { MockClient } from 'knex-mock-client';
import { userSchema } from '../../__test-utils__/schemas';
import knex from 'knex';
import { cloneDeep } from 'lodash';
import {
	FieldNode,
	FragmentDefinitionNode,
	GraphQLObjectType,
	GraphQLResolveInfo,
	GraphQLScalarType,
	GraphQLSchema,
	SelectionNode,
} from 'graphql';

jest.mock('../../../database/index', () => {
	return { getDatabaseClient: jest.fn().mockReturnValue('postgres') };
});
jest.requireMock('../../../database/index');

jest.mock('../../../services/', () => {
	return {
		ItemsService: jest.fn().mockReturnValue({
			readSingleton: jest.fn().mockReturnValue({ singleton: true }),
			readByQuery: jest.fn().mockReturnValue({ singleton: false }),
		}),
		ActivityService: jest.fn().mockReturnThis(),
		FilesService: jest.fn().mockReturnThis(),
		FoldersService: jest.fn().mockReturnThis(),
		PermissionsService: jest.fn().mockReturnThis(),
		PresetsService: jest.fn().mockReturnThis(),
		NotificationsService: jest.fn().mockReturnThis(),
		RevisionsService: jest.fn().mockReturnThis(),
		RolesService: jest.fn().mockReturnThis(),
		SettingsService: jest.fn().mockReturnThis(),
		UsersService: jest.fn().mockReturnThis(),
		WebhooksService: jest.fn().mockReturnThis(),
		SharesService: jest.fn().mockReturnThis(),
	};
});

describe('Class ResolveQuery', () => {
	const mockKnex = knex({ client: MockClient });
	describe('resolveQuery', () => {
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
		const info = {
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

		const aggregationInfo = {
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
		it('returns the readByQuery mock when not a singleton', async () => {
			const adminResolver = new ResolveQuery({
				knex: mockKnex,
				accountability: { admin: true, role: 'admin' },
				schema: userSchema,
			});

			expect(await adminResolver.resolveQuery(info, 'user')).toStrictEqual({ singleton: false });
		});

		it('returns the readBySingleton mock when a singleton', async () => {
			const schema = cloneDeep(userSchema);
			schema.collections.authors.singleton = true;

			const adminResolver = new ResolveQuery({
				knex: mockKnex,
				accountability: { admin: true, role: 'admin' },
				schema,
			});

			expect(await adminResolver.resolveQuery(info, 'user')).toStrictEqual({ singleton: true });
		});

		it('returns null when theres no selections', async () => {
			const adminResolver = new ResolveQuery({
				knex: mockKnex,
				accountability: { admin: true, role: 'admin' },
				schema: userSchema,
			});
			expect(
				await adminResolver.resolveQuery(
					{
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
					},
					'user'
				)
			).toBe(null);
		});
	});

	describe('read', () => {
		it('readSingleton', async () => {
			const schema = cloneDeep(userSchema);
			schema.collections.authors.singleton = true;

			const adminResolver = new ResolveQuery({
				knex: mockKnex,
				accountability: { admin: true, role: 'admin' },
				schema,
			});

			const result = await adminResolver.read('authors', {});
			expect(result).toStrictEqual({ singleton: true });
		});

		it('readByQuery', async () => {
			const adminResolver = new ResolveQuery({
				knex: mockKnex,
				accountability: { admin: true, role: 'admin' },
				schema: userSchema,
			});

			const result = await adminResolver.read('authors', {});
			expect(result).toStrictEqual({ singleton: false });
		});
	});

	describe('getAggregateQuery', () => {
		const adminResolvers = new ResolveQuery({
			knex: mockKnex,
			accountability: { admin: true, role: 'admin' },
			schema: userSchema,
		});
		it('__type is ignored in the aggregate query', async () => {
			const result = await adminResolvers.getAggregateQuery({ aggregate: { sum: ['name'] } }, [
				{
					kind: 'Field',
					name: { kind: 'Name', value: '__type' },
				},
			]);
			expect(result).toStrictEqual({ aggregate: {} });
		});

		it('sum works', async () => {
			const result = await adminResolvers.getAggregateQuery({ aggregate: { sum: ['WowAUniqueInlineFragment'] } }, [
				{
					kind: 'Field',
					name: { kind: 'Name', value: 'WowAUniqueInlineFragment' },
				},
			]);
			expect(result).toStrictEqual({ aggregate: { WowAUniqueInlineFragment: [] } });
		});

		it("doesn't fail when accountability is null", async () => {
			const nullAccountability = new ResolveQuery({
				knex: mockKnex,
				accountability: null,
				schema: userSchema,
			});
			const result = await nullAccountability.getAggregateQuery({ aggregate: { sum: ['WowAUniqueInlineFragment'] } }, [
				{
					kind: 'Field',
					name: { kind: 'Name', value: 'WowAUniqueInlineFragment' },
				},
			]);
			expect(result).toStrictEqual({ aggregate: { WowAUniqueInlineFragment: [] } });
		});
	});
});
