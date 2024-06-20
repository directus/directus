import type { Knex } from 'knex';
import { randomUUID } from 'node:crypto';
import { processChunk } from '@directus/utils';

/**
 * The public role used to be `null`, we gotta create a single new policy for the permissions
 * previously attached to the public role (marked through `role = null`).
 */
const PUBLIC_POLICY_ID = 'abf8a154-5b1c-4a46-ac9c-7300570f4f17';

export async function up(knex: Knex) {
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
		table.uuid('policy').notNullable().references('directus_policies.id').onDelete('CASCADE');
		// Drop the foreign key constraint here in order to update `null` role to public policy ID
		table.dropForeign('role');
	});

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
	// Reinstate access control fields on directus roles + remove nesting

	await knex.schema.alterTable('directus_roles', (table) => {
		table.text('ip_access');
		table.boolean('enforce_tfa').defaultTo(false).notNullable();
		table.boolean('admin_access').defaultTo(false).notNullable();
		table.boolean('app_access').defaultTo(true).notNullable();

		table.dropForeign('parent');
		table.dropColumn('parent');
	});

	/////////////////////////////////////////////////////////////////////////////////////////////////
	// Copy policy access control rules back to roles

	const policies = await knex
		.select('id', 'ip_access', 'enforce_tfa', 'admin_access', 'app_access')
		.from('directus_policies')
		.whereNot({ id: PUBLIC_POLICY_ID });

	for (const policy of policies) {
		await knex('directus_roles')
			.update({
				ip_access: policy.ip_access,
				enforce_tfa: policy.enforce_tfa,
				admin_access: policy.admin_access,
				app_access: policy.app_access,
			})
			.where({ id: policy.id });
	}

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

	await knex.schema.alterTable('directus_permissions', (table) => {
		table.uuid('role').nullable();
	});

	await knex('directus_permissions').update({
		role: knex.ref('policy'),
	});

	await knex('directus_permissions')
		.update({
			role: null,
		})
		.where({ role: PUBLIC_POLICY_ID });

	await knex.schema.alterTable('directus_permissions', (table) => {
		table.uuid('role').references('directus_roles.id').alter();
		table.dropForeign('policy');
		table.dropColumn('policy');
	});

	/////////////////////////////////////////////////////////////////////////////////////////////////
	// Drop policies table

	await knex.schema.dropTable('directus_policies');
}
