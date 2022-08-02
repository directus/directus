import knex, { Knex } from 'knex';
import { MockClient } from 'knex-mock-client';
import { AuthorizationService } from '../../src/services';
import { userSchema } from '../__test-utils__/schemas';

jest.mock('../../src/database/index', () => {
	return { getDatabaseClient: jest.fn().mockReturnValue('postgres') };
});
jest.requireMock('../../src/database/index');

describe('Integration Tests', () => {
	const db: jest.Mocked<Knex> = knex({ client: MockClient }) as jest.Mocked<Knex>;
	const tableName = 'posts';

	describe('Services / AuthorizationService', () => {
		describe('validatePayload', () => {
			const service: AuthorizationService = new AuthorizationService({
				knex: db,
				accountability: {
					role: 'admin',
					admin: false,
					permissions: [
						{
							id: 1,
							role: 'admin',
							collection: tableName,
							action: 'read',
							permissions: {},
							validation: {},
							presets: null,
							fields: ['*'],
						},
						{
							id: 1,
							role: 'admin',
							collection: tableName,
							action: 'create',
							permissions: {},
							validation: {},
							presets: {
								publish_date: '$NOW',
							},
							fields: ['*'],
						},
						{
							id: 1,
							role: 'admin',
							collection: tableName,
							action: 'update',
							permissions: {},
							validation: {
								_and: [
									{
										publish_date: {
											_gt: '$NOW',
										},
									},
								],
							},
							presets: null,
							fields: ['*'],
						},
					],
				},
				schema: userSchema,
			});

			describe('create', () => {
				const nowTZ = new Date().toISOString();
				const newPosts = [
					{ id: 'd66ec139-2655-48c1-9d9a-4753f98a9ee7', title: 'Hello' },
					{ id: '6107c897-9182-40f7-b22e-4f044d1258d2', title: 'Hello 2', publish_date: nowTZ },
				];

				it.each(newPosts)('%s presets are added correctly to the payload', (payload) => {
					const payloadWithPresets = service.validatePayload('create', tableName, payload);

					expect(payloadWithPresets).toHaveProperty('publish_date');
					expect(payloadWithPresets.publish_date).not.toEqual('$NOW');
					expect(new Date(payloadWithPresets.publish_date).getTime()).toBeGreaterThanOrEqual(new Date(nowTZ).getTime());
				});
			});

			describe('update', () => {
				const nowTZ = new Date().toISOString();
				const newPosts = [
					{ id: 'd66ec139-2655-48c1-9d9a-4753f98a9ee7', title: 'Hello World' },
					{ id: '6107c897-9182-40f7-b22e-4f044d1258d2', title: 'Hello World 2', publish_date: nowTZ },
				];

				it.each(newPosts)('%s validates the payload correctly', (payload) => {
					// Should only validate if field is set in the payload
					if (!payload.publish_date) {
						const payloadWithPresets = service.validatePayload('update', tableName, payload);

						expect(payloadWithPresets).not.toHaveProperty('publish_date');
					} else {
						expect(() => {
							service.validatePayload('update', tableName, payload);
						}).toThrow(Array);
					}
				});
			});
		});
	});
});
