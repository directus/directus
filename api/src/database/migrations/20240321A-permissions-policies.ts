import type { Knex } from 'knex';
import { PayloadService } from '../../services/index.js';
import { getSchema } from '../../utils/get-schema.js';

export interface OldPermission {
	role: string;
	collection: string;
	action: string;
	permissions: null | Record<string, unknown>;
	validation: null | Record<string, unknown>;
	presets: null | Record<string, unknown>;
	fields: null | string;
}

export interface NewPermission {
	policy: string;
	collection: string;
	action: string;
	type: (typeof types)[number];
	rule: null | Record<string, unknown> | string[];
}

const types = ['access', 'fields', 'validation', 'presets'] as const;

/**
 * Execute the callback for every chunk of the array of given size `size`
 */
async function processChunk<T = unknown>(arr: T[], size: number, callback: (chunk: T[]) => Promise<void>) {
	for (let i = 0; i < arr.length; i += size) {
		const chunk = arr.slice(i, i + size);
		await callback(chunk);
	}
}

// NOTE: knex.schema.renameTable isn't reliable cross vendor, so can't be used here
export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable('directus_policies', (table) => {
		table.uuid('id').primary();
		table.string('name', 100).notNullable();
		table.text('description');
		table.text('ip_access');
		table.boolean('enforce_tfa');
		table.boolean('admin_access');
		table.boolean('app_access');
	});

	const roles = await knex
		.select('id', 'name', 'description', 'ip_access', 'enforce_tfa', 'admin_access', 'app_access')
		.from('directus_roles');

	if (roles.length > 0) {
		await processChunk(roles, 100, async (chunk) => {
			await knex('directus_policies').insert(chunk);
		});
	}

	// Drop access control fields from roles
	await knex.schema.alterTable('directus_roles', (table) => {
		table.dropColumn('ip_access');
		table.dropColumn('enforce_tfa');
		table.dropColumn('admin_access');
		table.dropColumn('app_access');
	});

	const permissionsRaw = await knex.select('*').from('directus_permissions');

	const payloadService = new PayloadService('directus_permissions', {
		knex,
		schema: await getSchema({ database: knex }),
	});

	const oldPermissions = (await payloadService.processValues('read', permissionsRaw)) as OldPermission[];

	const newPermissions: NewPermission[] = [];

	for (const oldPermission of oldPermissions) {
		const addNew = (type: (typeof types)[number], rule: Record<string, unknown> | string[]) => {
			newPermissions.push({
				policy: oldPermission.role,
				action: oldPermission.action,
				collection: oldPermission.collection,
				type,
				rule,
			});
		};

		if (oldPermission.permissions !== null) {
			addNew('access', oldPermission.permissions);
		}

		if (oldPermission.validation !== null) {
			addNew('validation', oldPermission.validation);
		}

		if (oldPermission.presets !== null) {
			addNew('presets', oldPermission.presets);
		}

		if (oldPermission.fields !== null) {
			addNew('fields', oldPermission.fields.split(','));
		}
	}

	await knex('directus_permissions').truncate();

	await knex.schema.alterTable('directus_permissions', (table) => {
		table.dropColumns('role', 'permissions', 'validation', 'presets', 'fields');

		table.string('type').notNullable();
		table.uuid('policy').notNullable().references('directus_policies.id');
		table.json('rule').notNullable();
	});

	if (newPermissions.length > 0) {
		const payloadServicePostMigration = new PayloadService('directus_permissions', {
			knex,
			schema: await getSchema({ database: knex, bypassCache: true }),
		});

		const toBeInserted = await payloadServicePostMigration.processValues('create', newPermissions);

		await processChunk(toBeInserted, 100, async (chunk) => {
			await knex('directus_permissions').insert(chunk);
		});
	}
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_roles', (table) => {
		table.text('ip_access');
		table.boolean('enforce_tfa').defaultTo(false);
		table.boolean('admin_access').defaultTo(false);
		table.boolean('app_access').defaultTo(false);
	});

	// Directus policies should be an exact copy of Directus roles on upgrade with the above 4 fields
	// missing. To get back to the previous state of roles, we should be able to pull the missing
	// data from the policies with identical IDs as they're a full copy.
	const policies: {
		id: string;
		ip_access: string;
		app_access: boolean;
		admin_access: boolean;
		enforce_tfa: boolean;
	}[] = await knex.select('id', 'ip_access', 'admin_access', 'app_access', 'enforce_tfa').from('directus_policies');

	const roles = await knex.select('*').from('directus_roles');

	for (const role of roles) {
		const policy = policies.find((policy) => policy.id === role.id);

		if (policy) {
			const { ip_access, app_access, enforce_tfa, admin_access } = policy;
			await knex('directus_roles').update({ ip_access, app_access, enforce_tfa, admin_access }).where({ id: role.id });
		}
	}

	const permissionsRaw = await knex.select('*').from('directus_permissions');

	const payloadService = new PayloadService('directus_permissions', {
		knex,
		schema: await getSchema({ database: knex, bypassCache: true }),
	});

	const newPermissions = (await payloadService.processValues('read', permissionsRaw)) as NewPermission[];

	const oldPermissions: OldPermission[] = [];

	for (const newPermission of newPermissions) {
		const existing = oldPermissions.find(
			(oldPermission) =>
				oldPermission.collection === newPermission.collection &&
				oldPermission.action === newPermission.action &&
				oldPermission.role === newPermission.policy,
		);

		if (existing) {
			// Mutate the existing permission to merge the different types together
			switch (newPermission.type) {
				case 'access':
					existing.permissions = newPermission.rule as Record<string, unknown> | null;
					break;
				case 'fields':
					existing.fields = (newPermission.rule as string[] | null)?.join(',') || null;
					break;
				case 'validation':
					existing.validation = newPermission.rule as Record<string, unknown> | null;
					break;
				case 'presets':
					existing.presets = newPermission.rule as Record<string, unknown> | null;
					break;
			}
		} else {
			// Create new permission record
			const oldPermission: OldPermission = {
				action: newPermission.action,
				collection: newPermission.collection,
				fields: null,
				permissions: null,
				presets: null,
				role: newPermission.policy,
				validation: null,
			};

			switch (newPermission.type) {
				case 'access':
					oldPermission.permissions = newPermission.rule as Record<string, unknown> | null;
					break;
				case 'fields':
					oldPermission.fields = (newPermission.rule as string[] | null)?.join(',') || null;
					break;
				case 'validation':
					oldPermission.validation = newPermission.rule as Record<string, unknown> | null;
					break;
				case 'presets':
					oldPermission.presets = newPermission.rule as Record<string, unknown> | null;
					break;
			}

			oldPermissions.push(oldPermission);
		}
	}

	await knex('directus_permissions').truncate();

	await knex.schema.alterTable('directus_permissions', (table) => {
		table.dropColumns('type', 'policy', 'rule');

		table.uuid('role').references('directus_roles.id').nullable();
		table.json('permissions');
		table.json('validation');
		table.json('presets');
		table.text('fields');
	});

	if (oldPermissions.length > 0) {
		const payloadServicePostMigration = new PayloadService('directus_permissions', {
			knex,
			schema: await getSchema({ database: knex, bypassCache: true }),
		});

		const toBeInserted = await payloadServicePostMigration.processValues('create', oldPermissions);

		await processChunk(toBeInserted, 100, async (chunk) => {
			await knex('directus_permissions').insert(chunk);
		});
	}

	await knex.schema.dropTable('directus_policies');
}
