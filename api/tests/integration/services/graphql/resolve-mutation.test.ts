import knex from 'knex';
import { MockClient } from 'knex-mock-client';
import { ResolveMutation } from '../../../../src/services/graphql/resolve-mutation';
import { ItemsService, QueryOptions } from '../../../../src/services/items';
import { systemSchema, userSchema } from '../../../__test-utils__/schemas';
import {
	createManyMutation,
	createOneMutation,
	updateOneMutation,
	deleteOneMutation,
	updateManyMutation,
	deleteManyMutation,
	singletonMutation,
} from '../../../__test-utils__/gql-queries';
import { Query } from '@directus/shared/types';
import { PrimaryKey } from '../../../../src/types';
import { GraphQLError } from 'graphql';

jest.mock('../../../../src/database/index', () => {
	return { getDatabaseClient: jest.fn().mockReturnValue('postgres') };
});

describe('Class ResolveMutation', () => {
	const mockKnex = knex({ client: MockClient });

	const scopes: Record<string, any> = {
		system: { schema: systemSchema, tables: Object.keys(systemSchema.collections) },
		items: { schema: userSchema, tables: Object.keys(userSchema.collections) },
	};

	describe('resolveMutation()', () => {
		let options = { knex: mockKnex, accountability: { admin: true, role: 'admin' }, schema: userSchema };
		let resolver: ResolveMutation;
		let createMany: any;
		let createOne: any;
		let updateMany: any;
		let updateOne: any;
		let deleteMany: any;
		let deleteOne: any;
		let upsert: any;
		let readMany: jest.SpyInstance<Promise<any[]>, [keys: PrimaryKey[], query?: Query, opts?: QueryOptions]>;
		let readOne: jest.SpyInstance<Promise<any>, [key: PrimaryKey, query?: Query, opts?: QueryOptions]>;
		let readSingleton: any;

		beforeEach(() => {
			readOne = jest.spyOn(ItemsService.prototype, 'readOne');
			readMany = jest.spyOn(ItemsService.prototype, 'readMany');
			readSingleton = jest.spyOn(ItemsService.prototype, 'readMany');

			createMany = jest.spyOn(ItemsService.prototype, 'createMany').mockResolvedValue([1]);
			createOne = jest.spyOn(ItemsService.prototype, 'createOne').mockResolvedValue(1);

			updateMany = jest.spyOn(ItemsService.prototype, 'updateMany').mockResolvedValue([1]);
			updateOne = jest.spyOn(ItemsService.prototype, 'updateOne').mockResolvedValue(1);

			deleteMany = jest.spyOn(ItemsService.prototype, 'deleteMany').mockResolvedValue([1]);
			deleteOne = jest.spyOn(ItemsService.prototype, 'deleteOne').mockResolvedValue(1);

			upsert = jest.spyOn(ItemsService.prototype, 'upsertSingleton').mockResolvedValue(1);
			readSingleton = jest.spyOn(ItemsService.prototype, 'readSingleton').mockResolvedValue([{ id: 1 }]);
		});

		afterEach(() => {
			options = { knex: mockKnex, accountability: { admin: true, role: 'admin' }, schema: userSchema };
			readMany.mockRestore();
			readOne.mockRestore();
			readSingleton.mockRestore();
			upsert.mockRestore();
			createMany.mockRestore();
			createOne.mockRestore();
			updateMany.mockRestore();
			updateOne.mockRestore();
			deleteMany.mockRestore();
			deleteOne.mockRestore();
		});

		describe('createMany with no args', () => {
			it.each(Object.keys(scopes))('%s', async (scope) => {
				const table = scopes[scope].tables[0];
				readMany.mockResolvedValueOnce(['createMany']);
				options.schema = scopes[scope].schema;

				resolver = new ResolveMutation(options);

				const response = await resolver.resolveMutation({}, createManyMutation(table), scope);

				/* because it has query = {field: ["date"]} it doesn't return true */
				expect(response).toStrictEqual(['createMany']);
				expect(createMany.mock.calls.length).toBe(1);

				/* Make sure no args are pass */
				expect(createMany.mock.calls[0][0]).toStrictEqual(undefined);

				expect(readMany.mock.calls.length).toStrictEqual(1);
				expect(readMany.mock.calls[0][0]).toStrictEqual([1]);
				expect(readMany.mock.calls[0][1]).toStrictEqual({ alias: {}, fields: ['date'], filter: undefined });

				/* Make sure the right function was called before readMany */
				expect(await readMany.mock.results[0].value).toStrictEqual(['createMany']);
			});
		});

		describe('createOne with no args', () => {
			it.each(Object.keys(scopes))('%s', async (scope) => {
				readOne.mockResolvedValueOnce('createOne');

				const table = scopes[scope].tables[0];

				options.schema = scopes[scope].schema;

				resolver = new ResolveMutation(options);

				const response = await resolver.resolveMutation({}, createOneMutation(table), scope);

				expect(createOne.mock.calls.length).toBe(1);
				expect(createOne.mock.calls[0][0]).toStrictEqual(undefined);

				expect(readOne.mock.calls.length).toStrictEqual(1);
				expect(readOne.mock.calls[0][0]).toStrictEqual(1);
				expect(readOne.mock.calls[0][1]).toStrictEqual({ alias: {}, fields: ['date'], filter: undefined });
				expect(await readOne.mock.results[0].value).toStrictEqual('createOne');
				expect(response).toStrictEqual('createOne');
			});
		});

		describe('updateOne with no args', () => {
			it.each(Object.keys(scopes))('%s', async (scope) => {
				readOne.mockResolvedValueOnce('updateOne');

				const table = scopes[scope].tables[0];

				options.schema = scopes[scope].schema;

				resolver = new ResolveMutation(options);

				const response = await resolver.resolveMutation({}, updateOneMutation(table), scope);

				expect(updateOne.mock.calls.length).toBe(1);
				expect(updateOne.mock.calls[0][0]).toStrictEqual(undefined);

				expect(readOne.mock.calls.length).toStrictEqual(1);
				expect(readOne.mock.calls[0][0]).toStrictEqual(1);
				expect(readOne.mock.calls[0][1]).toStrictEqual({ alias: {}, fields: ['date'], filter: undefined });
				expect(await readOne.mock.results[0].value).toStrictEqual('updateOne');
				expect(response).toStrictEqual('updateOne');
			});
		});

		describe('updateMany with no args', () => {
			it.each(Object.keys(scopes))('%s', async (scope) => {
				readMany.mockResolvedValueOnce(['updateMany']);

				const table = scopes[scope].tables[0];

				options.schema = scopes[scope].schema;

				resolver = new ResolveMutation(options);

				const response = await resolver.resolveMutation({}, updateManyMutation(table), scope);
				expect(response).toStrictEqual(['updateMany']);

				expect(updateMany.mock.calls.length).toBe(1);
				expect(updateMany.mock.calls[0][0]).toStrictEqual(undefined);

				expect(readMany.mock.calls.length).toStrictEqual(1);
				expect(readMany.mock.calls[0][0]).toStrictEqual([1]);
				expect(readMany.mock.calls[0][1]).toStrictEqual({ alias: {}, fields: ['date'], filter: undefined });
				expect(await readMany.mock.results[0].value).toStrictEqual(['updateMany']);
			});
		});

		describe('deleteOne with no args', () => {
			it.each(Object.keys(scopes))('%s', async (scope) => {
				readOne.mockResolvedValueOnce('deleteOne');

				const table = scopes[scope].tables[0];

				options.schema = scopes[scope].schema;

				resolver = new ResolveMutation(options);

				const response = await resolver.resolveMutation({}, deleteOneMutation(table), scope);

				expect(deleteOne.mock.calls.length).toBe(1);
				expect(deleteOne.mock.calls[0][0]).toStrictEqual(undefined);
			});
		});

		describe('deleteMany with no args', () => {
			it.each(Object.keys(scopes))('%s', async (scope) => {
				readMany.mockResolvedValueOnce([{ ids: [1] }]);

				const table = scopes[scope].tables[0];

				options.schema = scopes[scope].schema;

				resolver = new ResolveMutation(options);

				const response = await resolver.resolveMutation({}, deleteManyMutation(table), scope);
				expect(response).toStrictEqual({ ids: [1] });

				expect(deleteMany.mock.calls.length).toBe(1);
				expect(deleteMany.mock.calls[0][0]).toStrictEqual(undefined);
			});
		});

		describe('singleton', () => {
			it.each(Object.keys(scopes))('%s', async (scope) => {
				readSingleton.mockResolvedValue({ id: 1 });

				let table = scopes[scope].tables[0];
				options.schema = scopes[scope].schema;

				if (scope === 'system') table = 'users';

				resolver = new ResolveMutation(options);

				const response = await resolver.resolveMutation({}, singletonMutation(table), scope);
				expect(response).toStrictEqual({ id: 1 });

				expect(upsert.mock.calls.length).toBe(1);
				expect(upsert.mock.calls[0][0]).toStrictEqual(undefined);
			});
		});

		describe('error', () => {
			it.each(Object.keys(scopes))('%s', async (scope) => {
				readSingleton.mockResolvedValue({ id: 1 });

				const table = 'notATable';
				options.schema = scopes[scope].schema;

				resolver = new ResolveMutation(options);

				const response = await resolver.resolveMutation({}, singletonMutation(table), scope);
				expect(response).toBeInstanceOf(GraphQLError);
			});
		});
	});
});
