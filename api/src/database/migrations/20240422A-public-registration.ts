import type { Knex } from 'knex';

// To avoid typos
const TABLE_ROLES = 'directus_roles';
const COLUMN_ROLES_ID = `${TABLE_ROLES}.id`;
const TABLE_SETTINGS = 'directus_settings';
const NEW_COLUMN_IS_REGISTRATION_ENABLED = 'is_public_registration_enabled';
const NEW_COLUMN_ROLE = 'public_registration_role';
const NEW_COLUMN_VALIDATE_EMAIL = 'require_public_registration_email_validation';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable(TABLE_SETTINGS, (table) => {
		table.boolean(NEW_COLUMN_IS_REGISTRATION_ENABLED).notNullable().defaultTo(false);
		table.uuid(NEW_COLUMN_ROLE).nullable();
		table.foreign(NEW_COLUMN_ROLE).references(COLUMN_ROLES_ID).onDelete('SET NULL');
		table.boolean(NEW_COLUMN_VALIDATE_EMAIL).notNullable().defaultTo(true);
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable(TABLE_SETTINGS, (table) => {
		table.dropColumns(NEW_COLUMN_IS_REGISTRATION_ENABLED, NEW_COLUMN_ROLE, NEW_COLUMN_VALIDATE_EMAIL);
	});
}
