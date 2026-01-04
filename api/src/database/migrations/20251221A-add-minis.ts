import type { Knex } from 'knex';
import type { SettingsModuleBarLink, SettingsModuleBarModule } from '@directus/types';

type ModuleBar = (SettingsModuleBarLink | SettingsModuleBarModule)[];

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable('directus_minis', (table) => {
		table.uuid('id').primary().notNullable();
		table.string('name').notNullable();
		table.string('icon', 64).defaultTo('apps');
		table.text('description').nullable();
		table.json('ui_schema').nullable();
		table.json('panel_config_schema').nullable();
		table.text('script').nullable();
		table.text('css').nullable();
		table.string('status').notNullable().defaultTo('draft');
		table.timestamp('date_created').defaultTo(knex.fn.now());
		table.timestamp('date_updated').nullable();

		table.uuid('user_created').references('id').inTable('directus_users').onDelete('SET NULL');
		table.uuid('user_updated').references('id').inTable('directus_users').onDelete('SET NULL');
	});

	await updateModuleBar(knex, (moduleBar) => {
		if (moduleBar.find(({ id }: { id: string }) => id === 'minis')) return;

		const miniAppsModule: SettingsModuleBarModule = {
			type: 'module',
			id: 'minis',
			enabled: true,
		};

		const visualModuleIndex = moduleBar.findIndex(({ id }: { id: string }) => id === 'visual');
		moduleBar.splice(visualModuleIndex + 1, 0, miniAppsModule);

		return moduleBar;
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTable('directus_minis');

	await updateModuleBar(knex, (moduleBar) => moduleBar.filter(({ id }: { id: string }) => id !== 'minis'));
}

async function updateModuleBar(knex: Knex, modify: (moduleBar: ModuleBar) => ModuleBar | undefined) {
	const result = await knex('directus_settings').select('module_bar', 'id').first();

	if (result && result.module_bar) {
		const moduleBar = typeof result.module_bar === 'string' ? JSON.parse(result.module_bar) : result.module_bar;

		const updatedModuleBar = modify(moduleBar);
		if (!updatedModuleBar) return;

		await knex('directus_settings')
			.update({ module_bar: JSON.stringify(updatedModuleBar) })
			.where('id', result.id);
	}
}
