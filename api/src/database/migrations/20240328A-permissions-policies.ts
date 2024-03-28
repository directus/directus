import type { Knex } from 'knex';
import { randomUUID } from 'node:crypto';

async function processChunk<T = unknown>(arr: T[], size: number, callback: (chunk: T[]) => Promise<void>) {
	for (let i = 0; i < arr.length; i += size) {
		const chunk = arr.slice(i, i + size);
		await callback(chunk);
	}
}

export async function up(knex: Knex) {
	/////////////////////////////////////////////////////////////////////////////////////////////////
	// Create new policies table that mirrors previous Roles

	await knex.schema.createTable('directus_policies', (table) => {
		table.uuid('id').primary();
		table.string('name', 100).notNullable();
		table.text('description');
		table.text('ip_access');
		table.boolean('enforce_tfa');
		table.boolean('admin_access');
		table.boolean('app_access');
	});

	/////////////////////////////////////////////////////////////////////////////////////////////////
	// Copy over all existing roles into new policies

	const roles = await knex
		.select('id', 'name', 'description', 'ip_access', 'enforce_tfa', 'admin_access', 'app_access')
		.from('directus_roles');

	if (roles.length > 0) {
		await processChunk(roles, 100, async (chunk) => {
			await knex('directus_policies').insert(chunk);
		});
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////
	// Remove access control fields from directus roles

	await knex.schema.alterTable('directus_roles', (table) => {
		table.dropColumn('ip_access');
		table.dropColumn('enforce_tfa');
		table.dropColumn('admin_access');
		table.dropColumn('app_access');
	});

	/////////////////////////////////////////////////////////////////////////////////////////////////
	// Link permissions to policies instead of roles

	await knex.schema.alterTable('directus_permissions', (table) => {
		table.uuid('policy').references('directus_policies.id');
	});

	await knex('directus_permissions').update({
		policy: knex.ref('role'),
	});

	await knex.schema.alterTable('directus_permissions', (table) => {
		table.uuid('policy').notNullable().alter();
		table.dropColumn('role');
	});

	/////////////////////////////////////////////////////////////////////////////////////////////////
	// Setup junction table between roles/users and policies

	await knex.schema.createTable('directus_access', (table) => {
		table.uuid('id').primary();
		table.string('collection', 64).index();
		table.uuid('item').index();
		table.uuid('policy').references('directus_policies.id');
		table.integer('sort');
	});

	/////////////////////////////////////////////////////////////////////////////////////////////////
	// Attach policies to existing roles for backwards compatibility

	const policyAttachments = roles.map((role) => ({
		id: randomUUID(),
		collection: 'directus_roles',
		item: role.id,
		policy: role.id,
		sort: 1,
	}));

	await processChunk(policyAttachments, 100, async (chunk) => {
		await knex('directus_access').insert(chunk);
	});
}

export async function down() {}
