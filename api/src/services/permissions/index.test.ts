import { randomIdentifier, randomInteger, randomUUID } from '@directus/random';
import type {
	Accountability,
	CollectionsOverview,
	DeepPartial,
	Filter,
	ItemPermissions,
	Permission,
	PermissionsAction,
	Query,
	SchemaOverview,
} from '@directus/types';
import type { Knex } from 'knex';
import knex from 'knex';
import { MockClient, Tracker, createTracker } from 'knex-mock-client';
import { cloneDeep } from 'lodash-es';
import type { MockedFunction } from 'vitest';
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { PermissionsService } from './index.js';
import { withAppMinimalPermissions } from './lib/with-app-minimal-permissions.js';

vi.mock('../../database/index.js', () => ({
	default: vi.fn(),
	getDatabaseClient: vi.fn().mockReturnValue('postgres'),
}));

vi.mock('./lib/with-app-minimal-permissions.js');

let db: MockedFunction<Knex>;
let tracker: Tracker;

beforeAll(async () => {
	db = vi.mocked(knex.default({ client: MockClient }));
	tracker = createTracker(db);
});

afterEach(() => {
	tracker.reset();
	vi.clearAllMocks();
});

const directusPermissionsSchema: DeepPartial<CollectionsOverview[string]> = {
	primary: 'id',
	fields: {
		id: { type: 'integer', special: [] },
		role: { type: 'string', special: [] },
		collection: { type: 'string', special: [] },
		action: { type: 'string', special: [] },
		permissions: { type: 'json', special: ['cast-json'] },
		validation: { type: 'json', special: ['cast-json'] },
		presets: { type: 'json', special: ['cast-json'] },
		fields: { type: 'csv', special: ['cast-csv'] },
	},
};

describe('Services / PermissionsService', () => {
	describe('with app minimal permissions', async () => {
		let service: PermissionsService;

		let sample: {
			permissionId: number;
			permissions: Permission[];
			accountability: Accountability;
			query: Query;
			result: Permission[];
		};

		beforeEach(() => {
			const permissionId = randomInteger(1, 100);
			const role = randomUUID();

			const permissions: Permission[] = [
				{
					id: permissionId,
					role,
					collection: 'directus_permissions',
					action: 'read',
					permissions: {},
					validation: {},
					presets: {},
					fields: ['*'],
				},
			];

			const accountability: Accountability = {
				user: randomUUID(),
				role,
				app: true,
				permissions,
			};

			const schema: DeepPartial<SchemaOverview> = {
				collections: {
					directus_permissions: directusPermissionsSchema,
				},
				relations: [],
			};

			const query: Query = { filter: { collection: { _eq: permissionId } } };

			const result: Permission[] = [{} as Permission];

			sample = {
				permissionId,
				permissions,
				accountability,
				query,
				result,
			};

			service = new PermissionsService({
				knex: db,
				schema: schema as SchemaOverview,
				accountability,
			});

			tracker.on.select('select "directus_permissions"').response(sample.permissions);
			vi.mocked(withAppMinimalPermissions).mockImplementation(() => result);
		});

		test('readByQuery', async () => {
			const result = await service.readByQuery(sample.query);

			expect(withAppMinimalPermissions).toBeCalledWith(sample.accountability, sample.permissions, sample.query.filter);
			expect(result).toEqual(sample.result);
		});

		test('readMany', async () => {
			const result = await service.readMany([sample.permissionId], sample.query);

			expect(withAppMinimalPermissions).toBeCalledWith(sample.accountability, sample.permissions, {
				_and: [
					{
						id: {
							_in: [sample.permissionId],
						},
					},
					sample.query.filter,
				],
			});

			expect(result).toEqual(sample.result);
		});

		test('readOne', async () => {
			const result = await service.readOne(sample.permissionId, sample.query);

			expect(withAppMinimalPermissions).toBeCalledWith(sample.accountability, sample.permissions, {
				...sample.query.filter,
				id: { _eq: sample.permissionId },
			});

			expect(result).toEqual(sample.result[0]);
		});
	});

	describe('#getItemPermissions', () => {
		const collection = randomIdentifier();
		const primaryKeyField = 'id';
		const primaryKey = randomInteger(1, 100);
		const permissionCheckField = 'title';
		const permissionCheck = randomIdentifier();

		const baseSchema: DeepPartial<SchemaOverview> = {
			collections: {
				directus_permissions: directusPermissionsSchema,
				[collection]: {
					collection: collection,
					primary: primaryKeyField,
					fields: {
						[primaryKeyField]: { field: primaryKeyField, type: 'integer', special: [] },
						[permissionCheckField]: { field: permissionCheckField, type: 'string', special: [] },
					},
				},
			},
			relations: [],
		};

		const permissionPreset: Omit<Permission, 'action'> = {
			role: null,
			collection,
			permissions: {},
			validation: {},
			presets: {},
			fields: ['*'],
		};

		const noAccess: ItemPermissions = {
			update: { access: false },
			delete: { access: false },
			share: { access: false },
		};

		const fullAccess: ItemPermissions = { update: { access: true }, delete: { access: true }, share: { access: true } };

		type Scenario = [
			scenario: string,
			{ accountability: Accountability; itemPermissions: ItemPermissions; selectCount: number },
		];

		const adminScenario: Scenario = [
			'admin',
			{
				accountability: { user: randomUUID(), role: randomUUID(), admin: true },
				itemPermissions: fullAccess,
				selectCount: 0,
			},
		];

		const user = { user: randomUUID(), role: randomUUID() } as Accountability;

		const actions: PermissionsAction[] = ['update', 'delete', 'share'];

		const userScenarios: Scenario[] = [
			[`user without permissions`, { accountability: user, itemPermissions: noAccess, selectCount: 0 }],
			...(actions.map((action) => [
				`user with ${action} permission`,
				{
					accountability: { ...user, permissions: [{ ...permissionPreset, action }] },
					itemPermissions: actions.reduce((a, v) => ({ ...a, [v]: { access: v === action } }), {}),
					selectCount: 1,
				},
			]) as Scenario[]),
			[
				`user with full permissions`,
				{
					accountability: {
						...user,
						permissions: actions.map((action) => ({ ...permissionPreset, action })),
					},
					itemPermissions: fullAccess,
					selectCount: 3,
				},
			],
		];

		const userConditionalScenarios = actions.map((action) => [
			`user with conditional ${action} permission`,
			{
				accountability: {
					...user,
					permissions: [
						{
							...permissionPreset,
							action,
							permissions: {
								_and: [{ [permissionCheckField]: { _eq: permissionCheck } }],
							} as Filter,
						},
					],
				},
				itemPermissions: actions.reduce((a, v) => ({ ...a, [v]: { access: v === action } }), {}),
				selectCount: 1,
			},
		]) as Scenario[];

		test('requires authentication', async () => {
			const service = new PermissionsService({
				knex: db,
				schema: baseSchema as SchemaOverview,
				accountability: { user: null, role: null },
			});

			const promise = service.getItemPermissions(collection, String(primaryKey));

			await expect(promise).rejects.toThrow(`You don't have permission to access this.`);
		});

		const collectionTypes = ['collection', 'singleton'];

		describe.each(collectionTypes)('%s', (collectionType) => {
			const schema = cloneDeep(baseSchema) as SchemaOverview;
			if (collectionType === 'singleton') schema.collections[collection]!.singleton = true;

			describe('non-existing', () => {
				const scenarios = [
					// full access for admin
					adminScenario,
					// no access for all other users
					...([...userScenarios, ...userConditionalScenarios].map(([scenario, config]) => [
						scenario,
						{ ...config, itemPermissions: noAccess },
					]) as Scenario[]),
				];

				describe.each(scenarios)('%s', (_, { accountability, itemPermissions }) => {
					test('collection', async () => {
						const service = new PermissionsService({
							knex: db,
							schema: { collections: {}, relations: [] },
							accountability,
						});

						const result = await service.getItemPermissions(
							collection,
							collectionType === 'collection' ? String(primaryKey) : undefined,
						);

						expect(result).toEqual(itemPermissions);
					});

					test('item', async () => {
						const service = new PermissionsService({
							knex: db,
							schema,
							accountability,
						});

						tracker.on.select(collection).response([]);

						const result = await service.getItemPermissions(
							collection,
							collectionType === 'collection' ? String(primaryKey) : undefined,
						);

						expect(result).toEqual(itemPermissions);
					});
				});
			});

			describe('existing item', () => {
				beforeEach(() => {
					if (collectionType === 'singleton') {
						const checkSingletonStatement = `select "${collection}"."${primaryKeyField}" from "${collection}"`;

						tracker.on.select(checkSingletonStatement).responseOnce([{ [primaryKeyField]: primaryKey }]);
					}
				});

				test.each([adminScenario, ...userScenarios])(
					'%s',
					async (_, { accountability, itemPermissions, selectCount }) => {
						const service = new PermissionsService({
							knex: db,
							schema,
							accountability,
						});

						const checkPermissionStatement =
							collectionType === 'collection'
								? `select "${collection}"."${primaryKeyField}", "${collection}"."${permissionCheckField}" from "${collection}" where ("${collection}"."${primaryKeyField}" = ?)`
								: `select "${collection}"."${primaryKeyField}", "${collection}"."${permissionCheckField}" from "${collection}"`;

						tracker.on.select(checkPermissionStatement).response([{ [primaryKeyField]: primaryKey }]);

						const result = await service.getItemPermissions(
							collection,
							collectionType === 'collection' ? String(primaryKey) : undefined,
						);

						expect(tracker.history.all).toHaveLength(
							collectionType === 'singleton' && !accountability.admin ? selectCount + 1 : selectCount,
						);

						expect(result).toEqual(itemPermissions);
					},
				);

				describe.each(userConditionalScenarios)('%s', (_, { accountability, itemPermissions, selectCount }) => {
					const checkPermissionStatement =
						collectionType === 'collection'
							? `select "${collection}"."${primaryKeyField}", "${collection}"."${permissionCheckField}" from "${collection}" where ("${collection}"."${primaryKeyField}" = ? and ("${collection}"."${permissionCheckField}" = ?))`
							: `select "${collection}"."${primaryKeyField}", "${collection}"."${permissionCheckField}" from "${collection}" where (("${collection}"."${permissionCheckField}" = ?))`;

					test('matching condition', async () => {
						const service = new PermissionsService({
							knex: db,
							schema,
							accountability,
						});

						tracker.on
							.select(checkPermissionStatement)
							.response([{ [primaryKeyField]: primaryKey, [permissionCheckField]: permissionCheck }]);

						const result = await service.getItemPermissions(
							collection,
							collectionType === 'collection' ? String(primaryKey) : undefined,
						);

						expect(tracker.history.all).toHaveLength(collectionType === 'singleton' ? selectCount + 1 : selectCount);
						expect(result).toEqual(itemPermissions);
					});

					test('non-matching condition', async () => {
						const service = new PermissionsService({
							knex: db,
							schema,
							accountability,
						});

						tracker.on.select(new RegExp(checkPermissionStatement)).response([]);

						const result = await service.getItemPermissions(
							collection,
							collectionType === 'collection' ? String(primaryKey) : undefined,
						);

						expect(tracker.history.all).toContainEqual(
							expect.objectContaining({ sql: expect.stringContaining(checkPermissionStatement) }),
						);

						expect(result).toEqual(noAccess);
					});
				});
			});
		});

		describe('singleton', () => {
			const schema = cloneDeep(baseSchema) as SchemaOverview;
			schema.collections[collection]!.singleton = true;

			const permissionReadAccess = { ...permissionPreset, collection: 'directus_permissions', action: 'read' };

			test('use create permission if singleton does not exist', async () => {
				const permissions = [{ ...permissionPreset, action: 'create' }, permissionReadAccess] as Permission[];

				const service = new PermissionsService({
					knex: db,
					schema,
					accountability: {
						...user,
						permissions,
					},
				});

				tracker.on.select(collection).response([]);

				tracker.on.select('directus_permissions').response(permissions);

				vi.mocked(withAppMinimalPermissions).mockImplementation(() => permissions);

				const result = await service.getItemPermissions(collection);

				expect(result.update).toEqual({
					access: true,
					presets: permissionPreset.presets,
					fields: permissionPreset.fields,
				});
			});

			test('use update permission if singleton exists', async () => {
				const permissions = [{ ...permissionPreset, action: 'update' }, permissionReadAccess] as Permission[];

				const service = new PermissionsService({
					knex: db,
					schema,
					accountability: {
						...user,
						permissions,
					},
				});

				const checkSingletonStatement = `select "${collection}"."${primaryKeyField}" from "${collection}"`;
				tracker.on.select(checkSingletonStatement).responseOnce([{ [primaryKeyField]: primaryKey }]);

				const checkPermissionStatement = `select "${collection}"."${primaryKeyField}", "${collection}"."${permissionCheckField}" from "${collection}"`;

				tracker.on.select(checkPermissionStatement).response([{ [primaryKeyField]: primaryKey }]);

				tracker.on.select('directus_permissions').response(permissions);

				vi.mocked(withAppMinimalPermissions).mockImplementation(() => permissions);

				const result = await service.getItemPermissions(collection);

				expect(result.update).toEqual({
					access: true,
					presets: permissionPreset.presets,
					fields: permissionPreset.fields,
				});
			});

			test('requires permissions on directus_permissions to return presets and fields', async () => {
				const permissions = [{ ...permissionPreset, action: 'update' }] as Permission[];

				const service = new PermissionsService({
					knex: db,
					schema,
					accountability: {
						...user,
						permissions,
					},
				});

				const checkSingletonStatement = `select "${collection}"."${primaryKeyField}" from "${collection}"`;
				tracker.on.select(checkSingletonStatement).responseOnce([{ [primaryKeyField]: primaryKey }]);

				const checkPermissionStatement = `select "${collection}"."${primaryKeyField}", "${collection}"."${permissionCheckField}" from "${collection}"`;

				tracker.on.select(checkPermissionStatement).response([{ [primaryKeyField]: primaryKey }]);

				tracker.on.select('directus_permissions').response(permissions);

				const result = await service.getItemPermissions(collection);

				expect(result.update).toEqual({ access: true });
			});
		});
	});
});
