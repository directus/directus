import type { SettingsModuleBarLink, SettingsModuleBarModule } from '@directus/types';
import type { Knex } from 'knex';

type ModuleBar = (SettingsModuleBarLink | SettingsModuleBarModule)[];

export async function up(knex: Knex): Promise<void> {
	await updateModuleBar(knex, (moduleBar) => {
		if (moduleBar.find(({ id }) => id === 'flows')) return;

		const flowsModule: SettingsModuleBarModule = {
			type: 'module',
			id: 'flows',
			enabled: true,
		};

		const insightsModuleIndex = moduleBar.findIndex(({ id }) => id === 'insights');
		const insertAt = insightsModuleIndex === -1 ? moduleBar.length : insightsModuleIndex + 1;
		moduleBar.splice(insertAt, 0, flowsModule);

		return moduleBar;
	});
}

export async function down(knex: Knex): Promise<void> {
	await updateModuleBar(knex, (moduleBar) => moduleBar.filter(({ id }) => id !== 'flows'));
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
