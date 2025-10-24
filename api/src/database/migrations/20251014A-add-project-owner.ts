import { useEnv } from '@directus/env';
import { toBoolean } from '@directus/utils';
import type { Knex } from 'knex';
import { env } from 'process';
import { SettingsService } from '../../services/settings.js';
import { getSchema } from '../../utils/get-schema.js';
import { EMAIL_REGEX } from '@directus/constants';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_settings', (table) => {
		table.string('project_owner');
		table.string('usage');
		table.string('org_name');
		table.boolean('email_news');
		table.dropColumn('accepted_terms');
	});

	const env = useEnv();

	const settingsService = new SettingsService({ schema: await getSchema() });

	if (env['PROJECT_OWNER'] && typeof env['PROJECT_OWNER'] === 'string' && EMAIL_REGEX.test(env['PROJECT_OWNER'])) {
		await settingsService.setOwner({ email: env['PROJECT_OWNER'], org_name: null, usage: null, email_news: false });
	}
}

export async function down(knex: Knex): Promise<void> {
	const acceptedTerms: boolean = toBoolean(env['ACCEPT_TERMS']);

	await knex.schema.alterTable('directus_settings', (table) => {
		table.dropColumn('project_owner');
		table.boolean('accepted_terms').defaultTo(acceptedTerms);
	});
}
