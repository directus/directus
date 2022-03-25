import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	const fields = await knex
		.select<{ id: number; special: string }[]>('id', 'special')
		.from('directus_fields')
		.whereNotNull('special')
		.orWhere('special', '<>', '');

	for (const { id, special } of fields) {
		let parsedSpecial;

		try {
			if (special.includes('{')) {
				parsedSpecial = special.replace(/{/g, '').replace(/}/g, '').replace(/"/g, '');
			}
		} catch {
			continue;
		}

		if (parsedSpecial && parsedSpecial !== special) {
			await knex('directus_fields').update({ special: parsedSpecial }).where({ id });
		}
	}
}

export async function down(_knex: Knex): Promise<void> {
	// Do nothing
}
