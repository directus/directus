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
		let readMany: any;
		let readOne: any;

		beforeEach(() => {
			createMany = jest.spyOn(ItemsService.prototype, 'createMany').mockResolvedValue([1]);
			readMany = jest.spyOn(ItemsService.prototype, 'readMany').mockResolvedValueOnce(['createMany']);

			createOne = jest.spyOn(ItemsService.prototype, 'createOne').mockResolvedValue(1);
			readOne = jest.spyOn(ItemsService.prototype, 'readOne').mockResolvedValueOnce('createOne');

			updateMany = jest.spyOn(ItemsService.prototype, 'updateMany').mockResolvedValue([1]);
			readMany = jest.spyOn(ItemsService.prototype, 'readMany').mockResolvedValueOnce(['updateMany']);

			updateOne = jest.spyOn(ItemsService.prototype, 'updateOne').mockResolvedValue(1);
			readOne = jest.spyOn(ItemsService.prototype, 'readOne').mockResolvedValue('updateOne');

			deleteMany = jest.spyOn(ItemsService.prototype, 'deleteMany').mockResolvedValue([1]);
			readMany = jest.spyOn(ItemsService.prototype, 'readMany').mockResolvedValueOnce(['deleteMany']);

			deleteOne = jest.spyOn(ItemsService.prototype, 'deleteOne').mockResolvedValue(1);
			readOne = jest.spyOn(ItemsService.prototype, 'readOne').mockResolvedValueOnce('deleteOne');
		});

		afterEach(() => {
			options = { knex: mockKnex, accountability: { admin: true, role: 'admin' }, schema: userSchema };
			createMany.mockRestore();
			createOne.mockRestore();
			updateMany.mockRestore();
			updateOne.mockRestore();
			deleteMany.mockRestore();
			deleteOne.mockRestore();
			readMany.mockRestore();
			readOne.mockRestore();
		});

		describe('createMany with no args', () => {
			it.each(Object.keys(scopes))('%s', async (scope) => {
				const table = scopes[scope].tables[0];

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

		// 	describe('createOne with no args', () => {
		// 		it.each(Object.keys(scopes))('%s',async (scope) => {
		// 			const table = scopes[scope].tables[0];

		// 			options.schema = scopes[scope].schema;

		// 			resolver = new ResolveMutation(options);

		// 			const response = await resolver.resolveMutation({}, updateManyMutation(table), scope);
		// 			expect(response).toStrictEqual('updateMany');

		// 			expect(updateMany.mock.calls.length).toBe(1);
		// 			expect(updateMany.mock.calls[0][0]).toStrictEqual(undefined);

		// 			expect(readOne.mock.calls.length).toStrictEqual(1);
		// 			expect(readOne.mock.calls[0][0]).toStrictEqual(1);
		// 			expect(readOne.mock.calls[0][1]).toStrictEqual({"alias": {}, "fields": ["date"], "filter": undefined});
		// 			expect(await readOne.mock.results[0].value).toStrictEqual('updateMany');

		// 		});
		// 	});

		// 	describe('updateOne with no args', () => {
		// 		it.each(Object.keys(scopes))('%s', (scope) => {
		// 			const table = scopes[scope].tables[0];

		// 			options.schema = scopes[scope].schema;

		// 			resolver = new ResolveMutation(options);

		// 			resolver.resolveMutation({}, updateOneMutation(table), scope);

		// 			expect(updateOne.mock.calls.length).toBe(1);
		// 			expect(updateOne.mock.calls[0][0]).toStrictEqual(undefined);
		// 			expect(updateOne.mock.results.length).toBe(1);
		// 		});
		// 	});

		// 	describe('updateMany with no args', () => {
		// 		it.each(Object.keys(scopes))('%s', async (scope) => {
		// 			const table = scopes[scope].tables[0];

		// 			options.schema = scopes[scope].schema;

		// 			resolver = new ResolveMutation(options);

		// 			const response = await resolver.resolveMutation({}, updateManyMutation(table), scope);
		// 			expect(response).toStrictEqual(['updateMany']);

		// 			expect(updateMany.mock.calls.length).toBe(1);
		// 			expect(updateMany.mock.calls[0][0]).toStrictEqual(undefined);

		// 			expect(readMany.mock.calls.length).toStrictEqual(1);
		// 			expect(readMany.mock.calls[0][0]).toStrictEqual([1]);
		// 			expect(readMany.mock.calls[0][1]).toStrictEqual({"alias": {}, "fields": ["date"], "filter": undefined});
		// 			expect(await readMany.mock.results[0].value).toStrictEqual(['updateMany']);

		// 		});
		// 	});
		// 	describe('deleteOne with no args', () => {
		// 		it.each(Object.keys(scopes))('%s', (scope) => {
		// 			const table = scopes[scope].tables[0];

		// 			options.schema = scopes[scope].schema;

		// 			resolver = new ResolveMutation(options);

		// 			resolver.resolveMutation({}, deleteOneMutation(table), scope);

		// 			expect(deleteOne.mock.calls.length).toBe(1);
		// 			expect(deleteOne.mock.calls[0][0]).toStrictEqual(undefined);
		// 		});
		// 	});
		// 	describe('deleteMany with no args', () => {
		// 		it.each(Object.keys(scopes))('%s', (scope) => {
		// 			const table = scopes[scope].tables[0];

		// 			options.schema = scopes[scope].schema;

		// 			resolver = new ResolveMutation(options);

		// 			resolver.resolveMutation({}, deleteManyMutation(table), scope);

		// 			expect(deleteMany.mock.calls.length).toBe(1);
		// 			expect(deleteMany.mock.calls[0][0]).toStrictEqual(undefined);
		// 		});
		// });
	});
});
