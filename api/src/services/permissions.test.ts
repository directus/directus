import { randomIdentifier, randomInteger, randomUUID } from '@directus/random';
import type {
	Accountability,
	DeepPartial,
	Filter,
	Permission,
	PermissionsAction,
	SchemaOverview,
} from '@directus/types';
import type { Knex } from 'knex';
import knex from 'knex';
import { MockClient, Tracker, createTracker } from 'knex-mock-client';
import type { MockedFunction } from 'vitest';
import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest';
import type { ItemPermissionsAccess } from '../types/permissions.js';
import { PermissionsService } from './index.js';

vi.mock('../database/index.js', () => ({
	default: vi.fn(),
	getDatabaseClient: vi.fn().mockReturnValue('postgres'),
}));

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

describe('Services / PermissionsService', () => {
	describe('#getItemPermissions', () => {
		const collection = randomIdentifier();
		const primaryKeyField = 'id';
		const primaryKey = randomInteger(1, 100);
		const permissionCheckField = 'title';
		const permissionCheck = randomIdentifier();

		const schema: DeepPartial<SchemaOverview> = {
			collections: {
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

		const actions: PermissionsAction[] = ['update', 'delete', 'share'];

		const permissionPreset: Omit<Permission, 'action'> = {
			role: null,
			collection,
			permissions: {},
			validation: {},
			presets: {},
			fields: ['*'],
		};

		const noAccess: ItemPermissionsAccess = { update: false, delete: false, share: false };
		const fullAccess: ItemPermissionsAccess = { update: true, delete: true, share: true };

		const users = {
			public: { user: null, role: null },
			user: { user: randomUUID(), role: randomUUID() },
		} as const satisfies Record<string, Accountability>;

		type Scenario = [
			scenario: string,
			{ accountability: Accountability; access: ItemPermissionsAccess; selectCount: number },
		];

		const adminScenario: Scenario = [
			'admin',
			{
				accountability: { user: randomUUID(), role: randomUUID(), admin: true },
				access: fullAccess,
				selectCount: 0,
			},
		];

		const userScenarios: Scenario[] = Object.entries(users).flatMap(([user, accountability]) => {
			return [
				[`${user} without permissions`, { accountability, access: noAccess, selectCount: 0 }],
				...(actions.map((action) => [
					`${user} with ${action} permission`,
					{
						accountability: { ...accountability, permissions: [{ ...permissionPreset, action }] },
						access: actions.reduce((a, v) => ({ ...a, [v]: v === action }), {}),
						selectCount: 1,
					},
				]) as Scenario[]),
				[
					`${user} with full permissions`,
					{
						accountability: {
							...accountability,
							permissions: actions.map((action) => ({ ...permissionPreset, action })),
						},
						access: fullAccess,
						selectCount: 3,
					},
				],
			];
		});

		const userConditionalScenarios: Scenario[] = Object.entries(users).flatMap(
			([user, accountability]) =>
				actions.map((action) => [
					`${user} with conditional ${action} permission`,
					{
						accountability: {
							...accountability,
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
						access: actions.reduce((a, v) => ({ ...a, [v]: v === action }), {}),
						selectCount: 1,
					},
				]) as Scenario[],
		);

		describe('non-existing', () => {
			const scenarios = [
				// full access for admin
				adminScenario,
				// no access for all other users
				...([...userScenarios, ...userConditionalScenarios].map(([scenario, config]) => [
					scenario,
					{ ...config, access: noAccess },
				]) as Scenario[]),
			];

			describe.each(scenarios)('%s', (_, { accountability, access }) => {
				test('collection', async () => {
					const service = new PermissionsService({
						knex: db,
						schema: { collections: {}, relations: [] },
						accountability,
					});

					const result = await service.getItemPermissions(collection, String(primaryKey));

					expect(result).toMatchObject({ access });
				});

				test('item', async () => {
					const service = new PermissionsService({
						knex: db,
						schema: schema as SchemaOverview,
						accountability,
					});

					tracker.on.select(collection).response([]);

					const result = await service.getItemPermissions(collection, String(primaryKey));

					expect(result).toMatchObject({ access });
				});
			});
		});

		describe('existing item', () => {
			test.each([adminScenario, ...userScenarios])('%s', async (_, { accountability, access, selectCount }) => {
				const service = new PermissionsService({
					knex: db,
					schema: schema as SchemaOverview,
					accountability,
				});

				tracker.on
					.select(
						`select "${collection}"."${primaryKeyField}", "${collection}"."${permissionCheckField}" from "${collection}" where ("${collection}"."${primaryKeyField}" = ?)`,
					)
					.response([{ [primaryKeyField]: primaryKey }]);

				const result = await service.getItemPermissions(collection, String(primaryKey));

				expect(tracker.history.select).toHaveLength(selectCount);
				expect(result).toMatchObject({ access });
			});

			describe.each(userConditionalScenarios)('%s', (_, { accountability, access, selectCount }) => {
				const sql = `select "${collection}"."${primaryKeyField}", "${collection}"."${permissionCheckField}" from "${collection}" where ("${collection}"."${primaryKeyField}" = ? and ("${collection}"."${permissionCheckField}" = ?)) order by "${collection}"."${primaryKeyField}" asc limit ?`;

				test('matching condition', async () => {
					const service = new PermissionsService({
						knex: db,
						schema: schema as SchemaOverview,
						accountability,
					});

					tracker.on.select(sql).response([{ [primaryKeyField]: primaryKey, [permissionCheckField]: permissionCheck }]);

					const result = await service.getItemPermissions(collection, String(primaryKey));

					expect(tracker.history.select).toHaveLength(selectCount);
					expect(result).toMatchObject({ access });
				});

				test('non-matching condition', async () => {
					const service = new PermissionsService({
						knex: db,
						schema: schema as SchemaOverview,
						accountability,
					});

					tracker.on.select(sql).response([]);

					const result = await service.getItemPermissions(collection, String(primaryKey));

					expect(tracker.history.select).toContainEqual(expect.objectContaining({ sql }));
					expect(result).toMatchObject({ access: noAccess });
				});
			});
		});
	});
});
