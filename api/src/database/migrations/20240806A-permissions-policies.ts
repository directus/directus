import { processChunk, toBoolean } from '@directus/utils';
import type { Knex } from 'knex';
import { omit } from 'lodash-es';
import { randomUUID } from 'node:crypto';
import { useLogger } from '../../logger/index.js';
import { fetchPermissions } from '../../permissions/lib/fetch-permissions.js';
import { fetchPolicies } from '../../permissions/lib/fetch-policies.js';
import { fetchRolesTree } from '../../permissions/lib/fetch-roles-tree.js';
import { getSchema } from '../../utils/get-schema.js';

import type { Accountability, Permission } from '@directus/types';
import { mergePermissions } from '../../permissions/utils/merge-permissions.js';
import { getSchemaInspector } from '../index.js';

type RoleAccess = {
	app_access: boolean;
	admin_access: boolean;
	ip_access: string | null;
	enforce_tfa: boolean;
};

async function fetchRoleAccess(roles: string[], context: { knex: Knex }) {
	const roleAccess: RoleAccess = {
		admin_access: false,
		app_access: false,
		ip_access: null,
		enforce_tfa: false,
	};

	const accessRows = await context
		.knex('directus_access')
		.select(
			'directus_policies.id',
			'directus_policies.admin_access',
			'directus_policies.app_access',
			'directus_policies.ip_access',
			'directus_policies.enforce_tfa',
		)
		.where('role', 'in', roles)
		.leftJoin('directus_policies', 'directus_policies.id', 'directus_access.policy');

	const ipAccess = new Set();

	for (const { admin_access, app_access, ip_access, enforce_tfa } of accessRows) {
		roleAccess.admin_access ||= toBoolean(admin_access);
		roleAccess.app_access ||= toBoolean(app_access);
		roleAccess.enforce_tfa ||= toBoolean(enforce_tfa);

		if (ip_access && ip_access.length) {
			ip_access.split(',').forEach((ip: string) => ipAccess.add(ip));
		}
	}

	if (ipAccess.size > 0) {
		roleAccess.ip_access = Array.from(ipAccess).join(',');
	}

	return roleAccess;
}

/**
 * The public role used to be `null`, we gotta create a single new policy for the permissions
 * previously attached to the public role (marked through `role = null`).
 */
const PUBLIC_POLICY_ID = 'abf8a154-5b1c-4a46-ac9c-7300570f4f17';

export async function up(knex: Knex) {
	const logger = useLogger();

	/////////////////////////////////////////////////////////////////////////////////////////////////
	// If the policies table already exists the migration has already run
	if (await knex.schema.hasTable('directus_policies')) {
		return;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////
	// Create new policies table that mirrors previous Roles

	await knex.schema.createTable('directus_policies', (table) => {
		table.uuid('id').primary();
		table.string('name', 100).notNullable();
		table.string('icon', 64).notNullable().defaultTo('badge');
		table.text('description');
		table.text('ip_access');
		table.boolean('enforce_tfa').defaultTo(false).notNullable();
		table.boolean('admin_access').defaultTo(false).notNullable();
		table.boolean('app_access').defaultTo(false).notNullable();
	});

	/////////////////////////////////////////////////////////////////////////////////////////////////
	// Copy over all existing roles into new policies

	const roles = await knex
		.select('id', 'name', 'icon', 'description', 'ip_access', 'enforce_tfa', 'admin_access', 'app_access')
		.from('directus_roles');

	if (roles.length > 0) {
		await processChunk(roles, 100, async (chunk) => {
			await knex('directus_policies').insert(chunk);
		});
	}

	await knex
		.insert({
			id: PUBLIC_POLICY_ID,
			name: '$t:public_label',
			icon: 'public',
			description: '$t:public_description',
			app_access: false,
		})
		.into('directus_policies');

	// Change the admin policy description to $t:admin_policy_description
	await knex('directus_policies')
		.update({
			description: '$t:admin_policy_description',
		})
		.where('description', 'LIKE', '$t:admin_description');

	/////////////////////////////////////////////////////////////////////////////////////////////////
	// Remove access control + add nesting to roles

	await knex.schema.alterTable('directus_roles', (table) => {
		table.dropColumn('ip_access');
		table.dropColumn('enforce_tfa');
		table.dropColumn('admin_access');
		table.dropColumn('app_access');

		table.uuid('parent').references('directus_roles.id');
	});

	/////////////////////////////////////////////////////////////////////////////////////////////////
	// Link permissions to policies instead of roles

	await knex.schema.alterTable('directus_permissions', (table) => {
		table.uuid('policy');
	});

	try {
		const inspector = await getSchemaInspector(knex);
		const foreignKeys = await inspector.foreignKeys('directus_permissions');

		const foreignConstraint =
			foreignKeys.find((foreign) => foreign.foreign_key_table === 'directus_roles' && foreign.column === 'role')
				?.constraint_name || undefined;

		await knex.schema.alterTable('directus_permissions', (table) => {
			// Drop the foreign key constraint here in order to update `null` role to public policy ID
			table.dropForeign('role', foreignConstraint);
		});
	} catch {
		logger.warn('Failed to drop foreign key constraint on `role` column in `directus_permissions` table');
	}

	await knex('directus_permissions')
		.update({
			role: PUBLIC_POLICY_ID,
		})
		.whereNull('role');

	await knex('directus_permissions').update({
		policy: knex.ref('role'),
	});

	await knex.schema.alterTable('directus_permissions', (table) => {
		table.dropColumns('role');
		table.dropNullable('policy');
		table.foreign('policy').references('directus_policies.id').onDelete('CASCADE');
	});

	/////////////////////////////////////////////////////////////////////////////////////////////////
	// Setup junction table between roles/users and policies

	// This could be a A2O style setup with a collection/item field rather than individual foreign
	// keys, but we want to be able to show the reverse-relationship on the individual policies as
	// well, which would require the O2A type to exist in Directus which currently doesn't.
	// Shouldn't be the end of the world here, as we know we're only attaching policies to two other
	// collections.

	await knex.schema.createTable('directus_access', (table) => {
		table.uuid('id').primary();
		table.uuid('role').references('directus_roles.id').nullable().onDelete('CASCADE');
		table.uuid('user').references('directus_users.id').nullable().onDelete('CASCADE');
		table.uuid('policy').references('directus_policies.id').notNullable().onDelete('CASCADE');
		table.integer('sort');
	});

	/////////////////////////////////////////////////////////////////////////////////////////////////
	// Attach policies to existing roles for backwards compatibility

	const policyAttachments = roles.map((role) => ({
		id: randomUUID(),
		role: role.id,
		user: null,
		policy: role.id,
		sort: 1,
	}));

	await processChunk(policyAttachments, 100, async (chunk) => {
		await knex('directus_access').insert(chunk);
	});

	await knex('directus_access').insert({
		id: randomUUID(),
		role: null,
		user: null,
		policy: PUBLIC_POLICY_ID,
		sort: 1,
	});
}

export async function down(knex: Knex) {
	/////////////////////////////////////////////////////////////////////////////////////////////////
	// Reinstate access control fields on directus roles

	await knex.schema.alterTable('directus_roles', (table) => {
		table.text('ip_access');
		table.boolean('enforce_tfa').defaultTo(false).notNullable();
		table.boolean('admin_access').defaultTo(false).notNullable();
		table.boolean('app_access').defaultTo(true).notNullable();
	});

	/////////////////////////////////////////////////////////////////////////////////////////////////
	// Copy policy access control rules back to roles

	const originalPermissions = await knex
		.select('id')
		.from('directus_permissions')
		.whereNot({ policy: PUBLIC_POLICY_ID });

	await knex.schema.alterTable('directus_permissions', (table) => {
		table.uuid('role').nullable();
		table.setNullable('policy');
	});

	const context = { knex, schema: await getSchema() };

	// fetch all roles
	const roles: Array<{ id: string | null }> = await knex.select('id').from('directus_roles');

	// simulate Public Role
	roles.push({ id: null });

	// role permissions to be inserted once all processing is completed
	const rolePermissions: Array<Omit<Permission, 'id' | 'system' | 'policy'> | { role: string | null }> = [];

	for (const role of roles) {
		const roleTree = await fetchRolesTree(role.id, { knex });

		let roleAccess = null;

		if (role.id !== null) {
			roleAccess = await fetchRoleAccess(roleTree, context);
			await knex('directus_roles').update(roleAccess).where({ id: role.id });
		}

		if (roleAccess === null || !roleAccess.admin_access) {
			// fetch all of the roles policies
			const policies = await fetchPolicies({ roles: roleTree, user: null, ip: null }, context);

			//  fetch all of the policies permissions
			const rawPermissions = await fetchPermissions(
				{
					accountability: {
						role: null,
						roles: roleTree,
						user: null,
						app: roleAccess?.app_access || false,
					} as Accountability,
					policies,
					bypassDynamicVariableProcessing: true,
				},
				context,
			);

			// merge all permissions to single version (v10) and save for later use
			(mergePermissions('or', rawPermissions) as any[]).forEach((permission) => {
				// System permissions are automatically populated
				if (permission.system) {
					return;
				}

				// convert merged permissions to storage ready format
				if (Array.isArray(permission.fields)) {
					permission.fields = permission.fields.join(',');
				}

				if (permission.permissions) {
					permission.permissions = JSON.stringify(permission.permissions);
				}

				if (permission.validation) {
					permission.validation = JSON.stringify(permission.validation);
				}

				if (permission.presets) {
					permission.presets = JSON.stringify(permission.presets);
				}

				rolePermissions.push({ role: role.id, ...omit(permission, ['id', 'policy']) });
			});
		}
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////
	// Remove role nesting support

	await knex.schema.alterTable('directus_roles', (table) => {
		table.dropForeign('parent');
		table.dropColumn('parent');
	});

	/////////////////////////////////////////////////////////////////////////////////////////////////
	// Drop all permissions that are only attached to a user

	// TODO query all policies that are attached to a user and delete their permissions,
	//  since we don't know were to put them now and it'll cause a foreign key problem
	//  as soon as we reference directus_roles in directus_permissions again

	/////////////////////////////////////////////////////////////////////////////////////////////////
	// Drop policy attachments

	await knex.schema.dropTable('directus_access');

	/////////////////////////////////////////////////////////////////////////////////////////////////
	// Reattach permissions to roles instead of policies

	await knex('directus_permissions')
		.update({
			role: null,
		})
		.where({ role: PUBLIC_POLICY_ID });

	// remove all v11 permissions
	await processChunk(originalPermissions, 100, async (chunk) => {
		await knex('directus_permissions').delete(chunk);
	});

	// insert all v10 permissions
	await processChunk(rolePermissions, 100, async (chunk) => {
		await knex('directus_permissions').insert(chunk);
	});

	await knex.schema.alterTable('directus_permissions', (table) => {
		table.uuid('role').references('directus_roles.id').alter();
		table.dropForeign('policy');
		table.dropColumn('policy');
	});

	/////////////////////////////////////////////////////////////////////////////////////////////////
	// Drop policies table

	await knex.schema.dropTable('directus_policies');
}
