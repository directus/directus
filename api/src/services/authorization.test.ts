import knex, { Knex } from 'knex';
import { getTracker, MockClient, Tracker } from 'knex-mock-client';
import { AuthorizationService, PayloadChunk } from '../../src/services';
import { userSchema } from '../__utils__/schemas';
import { cloneDeep } from 'lodash';

jest.mock('../../src/database/index', () => {
	return { getDatabaseClient: jest.fn().mockReturnValue('postgres') };
});
jest.requireMock('../../src/database/index');

describe('Integration Tests', () => {
	let db: jest.Mocked<Knex>;
	let tracker: Tracker;
	const tableName = 'posts';

	afterEach(() => {
		tracker.reset();
	});

	describe('Services / AuthorizationService', () => {
		describe('validatePayload', () => {
			db = knex({ client: MockClient }) as jest.Mocked<Knex>;
			tracker = getTracker();

			const schema = cloneDeep(userSchema);
			schema.collections.posts.fields.publish_date = {
				field: 'publish_date',
				defaultValue: null,
				nullable: true,
				generated: false,
				type: 'timestamp',
				dbType: 'timestamp',
				precision: null,
				scale: null,
				special: [],
				note: null,
				alias: false,
				validation: null,
			};

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
				schema,
			});

			describe('create', () => {
				const nowTZ = new Date().toISOString();
				const newPosts = [
					{ id: 'd66ec139-2655-48c1-9d9a-4753f98a9ee7', title: 'Hello' },
					{ id: '6107c897-9182-40f7-b22e-4f044d1258d2', title: 'Hello 2', publish_date: nowTZ },
				];

				it.each(newPosts)('presets are added correctly to the payload', async (payload) => {
					tracker.on.select(tableName).response([payload]);

					const { payload: payloadWithPresets } = (await service.validatePayload(
						'create',
						tableName,
						payload
					)) as PayloadChunk;

					expect(payloadWithPresets).toHaveProperty('publish_date');
					expect(payloadWithPresets.publish_date).not.toEqual('$NOW');
					expect(new Date(payloadWithPresets.publish_date).getTime()).toBeGreaterThanOrEqual(new Date(nowTZ).getTime());
				});
			});

			describe('update', () => {
				const nowTZ = new Date().toISOString();
				const newPosts = [
					{ id: 'd66ec139-2655-48c1-9d9a-4753f98a9ee7', title: 'Should succeed' },
					{ id: '6107c897-9182-40f7-b22e-4f044d1258d2', title: 'Should fail', publish_date: nowTZ },
				];

				it.each(newPosts)('validates the payload correctly', async (payload) => {
					tracker.on.select(tableName).response([payload]);

					// Should only validate if field is set in the payload
					if (!payload.publish_date) {
						const { payload: payloadWithPresets } = (await service.validatePayload(
							'update',
							tableName,
							payload,
							payload.id
						)) as PayloadChunk;

						expect(payloadWithPresets).not.toHaveProperty('publish_date');
					} else {
						const error = await service.validatePayload('update', tableName, payload).catch((err) => err.toString());
						expect(error).toContain('"publish_date" must be greater than');
					}
				});
			});

			tracker.reset();
		});
	});
});
