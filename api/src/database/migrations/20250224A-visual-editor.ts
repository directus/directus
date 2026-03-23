import type { SettingsModuleBarLink, SettingsModuleBarModule } from '@directus/types';
import type { Knex } from 'knex';

type ModuleBar = (SettingsModuleBarLink | SettingsModuleBarModule)[];

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_settings', (table) => {
		table.json('visual_editor_urls').nullable();
	});

	await updateModuleBar(knex, (moduleBar) => {
		if (moduleBar.find(({ id }: { id: string }) => id === 'visual')) return;

		const visualEditorModule: SettingsModuleBarModule = {
			type: 'module',
			id: 'visual',
			enabled: false,
		};

		const contentModuleIndex = moduleBar.findIndex(({ id }: { id: string }) => id === 'content');
		moduleBar.splice(contentModuleIndex + 1, 0, visualEditorModule);

		return moduleBar;
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_settings', (table) => {
		table.dropColumns('visual_editor_urls');
	});

	await updateModuleBar(knex, (moduleBar) => moduleBar.filter(({ id }: { id: string }) => id !== 'visual'));
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
