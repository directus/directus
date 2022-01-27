import knex from 'knex';
import { MockClient } from 'knex-mock-client';
import { ResolveMutation } from '../../../../src/services/graphql/resolve-mutation';
import { ItemsService } from '../../../../src/services/items';
import { systemSchema, userSchema } from '../../../__test-utils__/schemas';
import {
	createManyMutation,
	createOneMutation,
	updateOneMutation,
	deleteOneMutation,
	updateManyMutation,
	deleteManyMutation,
} from '../../../__test-utils__/gql-queries';

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

		beforeEach(() => {
			createMany = jest.spyOn(ItemsService.prototype, 'createMany').mockResolvedValue([1]);
			createOne = jest.spyOn(ItemsService.prototype, 'createOne').mockResolvedValue(1);
			updateMany = jest.spyOn(ItemsService.prototype, 'updateMany').mockResolvedValue([1]);
			updateOne = jest.spyOn(ItemsService.prototype, 'updateOne').mockResolvedValue(1);
			deleteMany = jest.spyOn(ItemsService.prototype, 'deleteMany').mockResolvedValue([1]);
			deleteOne = jest.spyOn(ItemsService.prototype, 'deleteOne').mockResolvedValue(1);
		});

		afterEach(() => {
			options = { knex: mockKnex, accountability: { admin: true, role: 'admin' }, schema: userSchema };
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

				options.schema = scopes[scope].schema;

				resolver = new ResolveMutation(options);

				resolver.resolveMutation({}, createManyMutation(table), scope);

				expect(createMany.mock.calls.length).toBe(1);

				/* Make sure no args are pass */
				expect(createMany.mock.calls[0][0]).toStrictEqual(undefined);

				// Need to figure out how to away await on that promise. It can't be tested bc it doesn't serialize to the same thing (functions dont turn into strings nicely).
				// expect(createMany.mock.results).toStrictEqual([{"type": "return", "value": Promise.resolve({})}]);
			});
		});

		describe('createOne with no args', () => {
			it.each(Object.keys(scopes))('%s', (scope) => {
				const table = scopes[scope].tables[0];

				options.schema = scopes[scope].schema;

				resolver = new ResolveMutation(options);

				resolver.resolveMutation({}, createOneMutation(table), scope);

				expect(createOne.mock.calls.length).toBe(1);
				expect(createOne.mock.calls[0][0]).toStrictEqual(undefined);
				expect(createOne.mock.results.length).toBe(1);
			});
		});

		describe('updateOne with no args', () => {
			it.each(Object.keys(scopes))('%s', (scope) => {
				const table = scopes[scope].tables[0];

				options.schema = scopes[scope].schema;

				resolver = new ResolveMutation(options);

				resolver.resolveMutation({}, updateOneMutation(table), scope);

				expect(updateOne.mock.calls.length).toBe(1);
				expect(updateOne.mock.calls[0][0]).toStrictEqual(undefined);
				expect(updateOne.mock.results.length).toBe(1);
			});
		});

		describe('updateMany with no args', () => {
			it.each(Object.keys(scopes))('%s', (scope) => {
				const table = scopes[scope].tables[0];

				options.schema = scopes[scope].schema;

				resolver = new ResolveMutation(options);

				resolver.resolveMutation({}, updateManyMutation(table), scope);

				expect(updateMany.mock.calls.length).toBe(1);
				expect(updateMany.mock.calls[0][0]).toStrictEqual(undefined);
				expect(updateMany.mock.results.length).toBe(1);
			});
		});
		describe('deleteOne with no args', () => {
			it.each(Object.keys(scopes))('%s', (scope) => {
				const table = scopes[scope].tables[0];

				options.schema = scopes[scope].schema;

				resolver = new ResolveMutation(options);

				resolver.resolveMutation({}, deleteOneMutation(table), scope);

				expect(deleteOne.mock.calls.length).toBe(1);
				expect(deleteOne.mock.calls[0][0]).toStrictEqual(undefined);
				expect(deleteOne.mock.results.length).toBe(1);
			});
		});
		describe('deleteMany with no args', () => {
			it.each(Object.keys(scopes))('%s', (scope) => {
				const table = scopes[scope].tables[0];

				options.schema = scopes[scope].schema;

				resolver = new ResolveMutation(options);

				resolver.resolveMutation({}, deleteManyMutation(table), scope);

				expect(deleteMany.mock.calls.length).toBe(1);
				expect(deleteMany.mock.calls[0][0]).toStrictEqual(undefined);
				expect(deleteMany.mock.results.length).toBe(1);
			});
		});
	});
});
