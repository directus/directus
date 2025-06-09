import type { Knex } from 'knex';
import { useEnv } from '@directus/env';

export async function up(knex: Knex): Promise<void> {
	const env = useEnv();

	const licenseBannerDisabled: boolean = env['LICENSE_BANNER_DISABLED'] as boolean;

	await knex.schema.alterTable('directus_settings', (table) => {
		table.boolean('license_banner_disabled').defaultTo(licenseBannerDisabled);
		table.boolean('license_banner_seen').defaultTo(false);
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_settings', (table) => {
		table.dropColumn('license_banner_disabled');
		table.dropColumn('license_banner_seen');
	});
}
