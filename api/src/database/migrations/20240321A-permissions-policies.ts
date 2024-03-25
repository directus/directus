import type { Knex } from 'knex';
import { isEqual } from 'lodash-es';

interface OldPermission {
	id: number;
	role: string;
	collection: string;
	action: string;
	permissions: null | Record<string, unknown>;
	validation: null | Record<string, unknown>;
	presets: null | Record<string, unknown>;
	fields: string;
}

interface NewPermission {
	id: number;
	policy: string;
	collections: string[];
	actions: string[];
	type: string;
	rule: null | Record<string, unknown> | string[];
}

const types = ['access', 'fields', 'validation', 'presets'] as const;

function jsonValueExists(val: null | Record<string, unknown> | string): boolean {
	try {
		if (typeof val === 'string') {
			val = JSON.parse(val);
		}

		if (val === null) return false;

		return Object.keys(val).length !== 0;
	} catch {
		return false;
	}
}

// NOTE: knex.schema.renameTable isn't reliable cross vendor, so can't be used here
export async function up(knex: Knex): Promise<void> {
	// Create policies table that's identical to roles
	await knex.schema.createTable('directus_policies', (table) => {
		table.uuid('id').primary();
		table.string('name', 100).notNullable();
		table.string('icon', 30).notNullable();
		table.text('description');
		table.text('ip_access');
		table.boolean('enforce_tfa');
		table.boolean('admin_access');
		table.boolean('app_access');
	});

	// Copy existing roles 1-1 to policies
	const roles = await knex.select('*').from('directus_roles');

	if (roles.length > 0) {
		await knex('directus_policies').insert(roles);
	}

	// Drop access control fields from roles
	await knex.schema.alterTable('directus_roles', (table) => {
		table.dropColumn('ip_access');
		table.dropColumn('enforce_tfa');
		table.dropColumn('admin_access');
		table.dropColumn('app_access');
	});

	// Migrate existing permissions to new structure
	const permissions = await knex.select<OldPermission[]>('*').from('directus_permissions');

	const newPermissions: Omit<NewPermission, 'id'>[] = [];

	for (const oldPermission of permissions) {
		for (const type of types) {
			let rule: NewPermission['rule'] = null;

			switch (type) {
				case 'access':
					rule = jsonValueExists(oldPermission.permissions) ? oldPermission.permissions : null;
					break;
				case 'fields':
					rule = oldPermission.fields?.split(',') ?? null;
					break;
				case 'validation':
					rule = jsonValueExists(oldPermission.validation) ? oldPermission.validation : null;
					break;
				case 'presets':
					rule = jsonValueExists(oldPermission.presets) ? oldPermission.presets : null;
					break;
			}

			if (rule === null) continue;

			const newPermission: Omit<NewPermission, 'id'> = {
				policy: oldPermission.role,
				collections: [oldPermission.collection],
				actions: [oldPermission.action],
				type: type,
				rule: rule,
			};

			newPermissions.push(newPermission);
		}
	}

	// Simplify the permissions per policy by combining permissions that have the same exact setup
	// for multiple collections or rules.
	for (let i = 0; i < newPermissions.length; i++) {
		if (!newPermissions[i]) continue;

		const parentPermission = newPermissions[i]!;

		const collections = new Set(parentPermission.collections);
		const actions = new Set(parentPermission.actions);

		const indexesToRemove: number[] = [];

		for (let j = i + 1; j < newPermissions.length; j++) {
			if (!newPermissions[j]) continue;
			const permission = newPermissions[j]!;

			if (
				permission.policy === parentPermission.policy &&
				permission.type === parentPermission.type &&
				isEqual(permission.rule, parentPermission.rule)
			) {
				permission.collections.forEach((collection) => collections.add(collection));
				permission.actions.forEach((action) => actions.add(action));
				indexesToRemove.push(j);
			}
		}

		// Reverse loop over the to-be-removed indexes to preserve indexes during splices
		for (let i = indexesToRemove.length - 1; i >= 0; i--) {
			newPermissions.splice(indexesToRemove[i]!, 1);
		}

		parentPermission.collections = Array.from(collections);
		parentPermission.actions = Array.from(actions);
	}

	// Add new structure to existing permissions
	await knex.schema.alterTable('directus_permissions', (table) => {
		table.json('collections').notNullable().index();
		table.json('actions').notNullable().index();
		table.string('type').notNullable().index();
		table.uuid('policy').references('directus_policies.id');
	});

	if (newPermissions.length > 0) {
		// Yes this scares me too, be brave
		await knex('directus_permissions').truncate();
		await knex('directus_permissions').insert(newPermissions);
	}
}

export async function down(_knex: Knex): Promise<void> {}
