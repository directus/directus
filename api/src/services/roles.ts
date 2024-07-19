import { InvalidPayloadError, UnprocessableContentError } from '@directus/errors';
import type { Alterations, Item, PrimaryKey, Query, User } from '@directus/types';
import { getMatch } from 'ip-matching';
import { omit } from 'lodash-es';
import { checkIncreasedUserLimits } from '../telemetry/utils/check-increased-user-limits.js';
import { getRoleCountsByUsers } from '../telemetry/utils/get-role-counts-by-users.js';
import { type AccessTypeCount } from '../telemetry/utils/get-user-count.js';
import { getUserCountsByRoles } from '../telemetry/utils/get-user-counts-by-roles.js';
import { shouldCheckUserLimits } from '../telemetry/utils/should-check-user-limits.js';
import type { AbstractServiceOptions, MutationOptions } from '../types/index.js';
import { shouldClearCache } from '../utils/should-clear-cache.js';
import { transaction } from '../utils/transaction.js';
import { ItemsService } from './items.js';
import { PermissionsService } from './permissions/index.js';
import { PresetsService } from './presets.js';
import { UsersService } from './users.js';

type RoleCount = {
	count: number | string;
	admin_access: number | boolean | null;
	app_access: number | boolean | null;
};

export class RolesService extends ItemsService {
	constructor(options: AbstractServiceOptions) {
		super('directus_roles', options);
	}

	private async checkForOtherAdminRoles(excludeKeys: PrimaryKey[]): Promise<void> {
		// Make sure there's at least one admin role left after this deletion is done
		const otherAdminRoles = await this.knex
			.count('*', { as: 'count' })
			.from('directus_roles')
			.whereNotIn('id', excludeKeys)
			.andWhere({ admin_access: true })
			.first();

		const otherAdminRolesCount = Number(otherAdminRoles?.count ?? 0);

		if (otherAdminRolesCount === 0) {
			throw new UnprocessableContentError({ reason: `You can't delete the last admin role` });
		}
	}

	private async checkForOtherAdminUsers(
		key: PrimaryKey,
		users: Alterations<User, 'id'> | (string | Partial<User>)[],
	): Promise<void> {
		const role = await this.knex.select('admin_access').from('directus_roles').where('id', '=', key).first();

		// No-op if role doesn't exist
		if (!role) return;

		const usersBefore = (await this.knex.select('id').from('directus_users').where('role', '=', key)).map(
			(user) => user.id,
		);

		const usersAdded: (Partial<User> & Pick<User, 'id'>)[] = [];
		const usersUpdated: (Partial<User> & Pick<User, 'id'>)[] = [];
		const usersCreated: Partial<User>[] = [];
		const usersRemoved: string[] = [];

		if (Array.isArray(users)) {
			const usersKept: string[] = [];

			for (const user of users) {
				if (typeof user === 'string') {
					if (usersBefore.includes(user)) {
						usersKept.push(user);
					} else {
						usersAdded.push({ id: user });
					}
				} else if (user.id) {
					if (usersBefore.includes(user.id)) {
						usersKept.push(user.id);
						usersUpdated.push(user as Partial<User> & Pick<User, 'id'>);
					} else {
						usersAdded.push(user as Partial<User> & Pick<User, 'id'>);
					}
				} else {
					usersCreated.push(user);
				}
			}

			usersRemoved.push(...usersBefore.filter((user) => !usersKept.includes(user)));
		} else {
			for (const user of users.update) {
				if (usersBefore.includes(user['id'])) {
					usersUpdated.push(user);
				} else {
					usersAdded.push(user);
				}
			}

			usersCreated.push(...users.create);
			usersRemoved.push(...users.delete);
		}

		if (role.admin_access === false || role.admin_access === 0) {
			// Admin users might have moved in from other role, thus becoming non-admin
			if (usersAdded.length > 0) {
				const otherAdminUsers = await this.knex
					.count('*', { as: 'count' })
					.from('directus_users')
					.leftJoin('directus_roles', 'directus_users.role', 'directus_roles.id')
					.whereNotIn(
						'directus_users.id',
						usersAdded.map((user) => user.id),
					)
					.andWhere({ 'directus_roles.admin_access': true, status: 'active' })
					.first();

				const otherAdminUsersCount = Number(otherAdminUsers?.count ?? 0);

				if (otherAdminUsersCount === 0) {
					throw new UnprocessableContentError({ reason: `You can't remove the last admin user from the admin role` });
				}
			}

			return;
		}

		// Only added or created new users
		if (usersUpdated.length === 0 && usersRemoved.length === 0) return;

		// Active admin user(s) about to be created
		if (usersCreated.some((user) => !('status' in user) || user.status === 'active')) return;

		const usersDeactivated = [...usersAdded, ...usersUpdated]
			.filter((user) => 'status' in user && user.status !== 'active')
			.map((user) => user.id);

		const usersAddedNonDeactivated = usersAdded
			.filter((user) => !usersDeactivated.includes(user.id))
			.map((user) => user.id);

		// Active user(s) about to become admin
		if (usersAddedNonDeactivated.length > 0) {
			const userCount = await this.knex
				.count('*', { as: 'count' })
				.from('directus_users')
				.whereIn('id', usersAddedNonDeactivated)
				.andWhere({ status: 'active' })
				.first();

			if (Number(userCount?.count ?? 0) > 0) {
				return;
			}
		}

		const otherAdminUsers = await this.knex
			.count('*', { as: 'count' })
			.from('directus_users')
			.leftJoin('directus_roles', 'directus_users.role', 'directus_roles.id')
			.whereNotIn('directus_users.id', [...usersDeactivated, ...usersRemoved])
			.andWhere({ 'directus_roles.admin_access': true, status: 'active' })
			.first();

		const otherAdminUsersCount = Number(otherAdminUsers?.count ?? 0);

		if (otherAdminUsersCount === 0) {
			throw new UnprocessableContentError({ reason: `You can't remove the last admin user from the admin role` });
		}

		return;
	}

	private isIpAccessValid(value?: any[] | null): boolean {
		if (value === undefined) return false;
		if (value === null) return true;
		if (Array.isArray(value) && value.length === 0) return true;

		for (const ip of value) {
			if (typeof ip !== 'string' || ip.includes('*')) return false;

			try {
				const match = getMatch(ip);
				if (match.type == 'IPMask') return false;
			} catch {
				return false;
			}
		}

		return true;
	}

	private assertValidIpAccess(partialItem: Partial<Item>): void {
		if ('ip_access' in partialItem && !this.isIpAccessValid(partialItem['ip_access'])) {
			throw new InvalidPayloadError({
				reason: 'IP Access contains an incorrect value. Valid values are: IP addresses, IP ranges and CIDR blocks',
			});
		}
	}

	private getRoleAccessType(data: Partial<Item>) {
		if ('admin_access' in data && data['admin_access'] === true) {
			return 'admin';
		} else if (('app_access' in data && data['app_access'] === true) || 'app_access' in data === false) {
			return 'app';
		} else {
			return 'api';
		}
	}

	override async createOne(data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey> {
		this.assertValidIpAccess(data);

		if (shouldCheckUserLimits()) {
			const increasedCounts: AccessTypeCount = {
				admin: 0,
				app: 0,
				api: 0,
			};

			const existingIds: PrimaryKey[] = [];

			if ('users' in data) {
				const type = this.getRoleAccessType(data);
				increasedCounts[type] += data['users'].length;

				for (const user of data['users']) {
					if (typeof user === 'string') {
						existingIds.push(user);
					} else if (typeof user === 'object' && 'id' in user) {
						existingIds.push(user['id']);
					}
				}
			}

			await checkIncreasedUserLimits(this.knex, increasedCounts, existingIds);
		}

		return super.createOne(data, opts);
	}

	override async createMany(data: Partial<Item>[], opts?: MutationOptions): Promise<PrimaryKey[]> {
		const needsUserLimitCheck = shouldCheckUserLimits();

		const increasedCounts: AccessTypeCount = {
			admin: 0,
			app: 0,
			api: 0,
		};

		const existingIds: PrimaryKey[] = [];

		for (const partialItem of data) {
			this.assertValidIpAccess(partialItem);

			if (needsUserLimitCheck && 'users' in partialItem) {
				const type = this.getRoleAccessType(partialItem);
				increasedCounts[type] += partialItem['users'].length;

				for (const user of partialItem['users']) {
					if (typeof user === 'string') {
						existingIds.push(user);
					} else if (typeof user === 'object' && 'id' in user) {
						existingIds.push(user['id']);
					}
				}
			}
		}

		if (needsUserLimitCheck) {
			await checkIncreasedUserLimits(this.knex, increasedCounts, existingIds);
		}

		return super.createMany(data, opts);
	}

	override async updateOne(key: PrimaryKey, data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey> {
		this.assertValidIpAccess(data);

		try {
			if ('users' in data) {
				await this.checkForOtherAdminUsers(key, data['users']);
			}

			if (shouldCheckUserLimits()) {
				const increasedCounts: AccessTypeCount = {
					admin: 0,
					app: 0,
					api: 0,
				};

				let increasedUsers = 0;

				const existingIds: PrimaryKey[] = [];

				let existingRole: RoleCount | undefined = await this.knex
					.count('directus_users.id', { as: 'count' })
					.select('directus_roles.admin_access', 'directus_roles.app_access')
					.from('directus_users')
					.where('directus_roles.id', '=', key)
					.andWhere('directus_users.status', '=', 'active')
					.leftJoin('directus_roles', 'directus_users.role', '=', 'directus_roles.id')
					.groupBy('directus_roles.admin_access', 'directus_roles.app_access')
					.first();

				if (!existingRole) {
					try {
						const role = (await this.knex
							.select('admin_access', 'app_access')
							.from('directus_roles')
							.where('id', '=', key)
							.first()) ?? { admin_access: null, app_access: null };

						existingRole = { count: 0, ...role } as RoleCount;
					} catch {
						existingRole = { count: 0, admin_access: null, app_access: null } as RoleCount;
					}
				}

				if ('users' in data) {
					const users: Alterations<User, 'id'> | (string | Partial<User>)[] = data['users'];

					if (Array.isArray(users)) {
						increasedUsers = users.length - Number(existingRole.count);

						for (const user of users) {
							if (typeof user === 'string') {
								existingIds.push(user);
							} else if (typeof user === 'object' && 'id' in user) {
								existingIds.push(user['id']);
							}
						}
					} else {
						increasedUsers += users.create.length;
						increasedUsers -= users.delete.length;

						const userIds = [];

						for (const user of users.update) {
							if ('status' in user) {
								// account for users being activated and deactivated
								if (user['status'] === 'active') {
									increasedUsers++;
								} else {
									increasedUsers--;
								}
							}

							userIds.push(user.id);
						}

						try {
							const existingCounts = await getRoleCountsByUsers(this.knex, userIds);

							if (existingRole.admin_access) {
								increasedUsers += existingCounts.app + existingCounts.api;
							} else if (existingRole.app_access) {
								increasedUsers += existingCounts.admin + existingCounts.api;
							} else {
								increasedUsers += existingCounts.admin + existingCounts.app;
							}
						} catch {
							// ignore failed user call
						}
					}
				}

				let isAccessChanged = false;
				let accessType: 'admin' | 'app' | 'api' = 'api';

				if ('app_access' in data) {
					if (data['app_access'] === true) {
						accessType = 'app';

						if (!existingRole.app_access) isAccessChanged = true;
					} else if (existingRole.app_access) {
						isAccessChanged = true;
					}
				} else if (existingRole.app_access) {
					accessType = 'app';
				}

				if ('admin_access' in data) {
					if (data['admin_access'] === true) {
						accessType = 'admin';

						if (!existingRole.admin_access) isAccessChanged = true;
					} else if (existingRole.admin_access) {
						isAccessChanged = true;
					}
				} else if (existingRole.admin_access) {
					accessType = 'admin';
				}

				if (isAccessChanged) {
					increasedCounts[accessType] += Number(existingRole.count);
				}

				increasedCounts[accessType] += increasedUsers;

				await checkIncreasedUserLimits(this.knex, increasedCounts, existingIds);
			}
		} catch (err: any) {
			(opts || (opts = {})).preMutationError = err;
		}

		return super.updateOne(key, data, opts);
	}

	override async updateBatch(data: Partial<Item>[], opts: MutationOptions = {}): Promise<PrimaryKey[]> {
		for (const partialItem of data) {
			this.assertValidIpAccess(partialItem);
		}

		const primaryKeyField = this.schema.collections[this.collection]!.primary;

		if (!opts.mutationTracker) {
			opts.mutationTracker = this.createMutationTracker();
		}

		const keys: PrimaryKey[] = [];

		try {
			await transaction(this.knex, async (trx) => {
				const service = new RolesService({
					accountability: this.accountability,
					knex: trx,
					schema: this.schema,
				});

				for (const item of data) {
					const combinedOpts = Object.assign({ autoPurgeCache: false }, opts);
					keys.push(await service.updateOne(item[primaryKeyField]!, omit(item, primaryKeyField), combinedOpts));
				}
			});
		} finally {
			if (shouldClearCache(this.cache, opts, this.collection)) {
				await this.cache.clear();
			}
		}

		return keys;
	}

	override async updateMany(keys: PrimaryKey[], data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey[]> {
		this.assertValidIpAccess(data);

		try {
			if ('admin_access' in data && data['admin_access'] === false) {
				await this.checkForOtherAdminRoles(keys);
			}

			if (shouldCheckUserLimits() && ('admin_access' in data || 'app_access' in data)) {
				const existingCounts: AccessTypeCount = await getUserCountsByRoles(this.knex, keys);

				const increasedCounts: AccessTypeCount = {
					admin: 0,
					app: 0,
					api: 0,
				};

				const type = this.getRoleAccessType(data);

				for (const [existingType, existingCount] of Object.entries(existingCounts)) {
					if (existingType === type) continue;
					increasedCounts[type] += existingCount;
				}

				await checkIncreasedUserLimits(this.knex, increasedCounts);
			}
		} catch (err: any) {
			(opts || (opts = {})).preMutationError = err;
		}

		return super.updateMany(keys, data, opts);
	}

	override async updateByQuery(
		query: Query,
		data: Partial<Item>,
		opts?: MutationOptions | undefined,
	): Promise<PrimaryKey[]> {
		this.assertValidIpAccess(data);

		return super.updateByQuery(query, data, opts);
	}

	override async deleteMany(keys: PrimaryKey[]): Promise<PrimaryKey[]> {
		const opts: MutationOptions = {};

		try {
			await this.checkForOtherAdminRoles(keys);
		} catch (err: any) {
			opts.preMutationError = err;
		}

		await transaction(this.knex, async (trx) => {
			const itemsService = new ItemsService('directus_roles', {
				knex: trx,
				accountability: this.accountability,
				schema: this.schema,
			});

			const permissionsService = new PermissionsService({
				knex: trx,
				accountability: this.accountability,
				schema: this.schema,
			});

			const presetsService = new PresetsService({
				knex: trx,
				accountability: this.accountability,
				schema: this.schema,
			});

			const usersService = new UsersService({
				knex: trx,
				accountability: this.accountability,
				schema: this.schema,
			});

			// Delete permissions/presets for this role, suspend all remaining users in role

			await permissionsService.deleteByQuery(
				{
					filter: { role: { _in: keys } },
				},
				{ ...opts, bypassLimits: true },
			);

			await presetsService.deleteByQuery(
				{
					filter: { role: { _in: keys } },
				},
				{ ...opts, bypassLimits: true },
			);

			await usersService.updateByQuery(
				{
					filter: { role: { _in: keys } },
				},
				{
					status: 'suspended',
					role: null,
				},
				{ ...opts, bypassLimits: true },
			);

			await itemsService.deleteMany(keys, opts);
		});

		return keys;
	}
}
