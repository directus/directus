import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	const fields = await knex
		.select<{ id: number; options: string }[]>('id', 'options')
		.from('directus_fields')
		.where('interface', '=', 'input-rich-text-html')
		.orWhere('interface', '=', 'input-rich-text-md');

	for (const { id, options } of fields) {
		let parsedOptions;

		try {
			parsedOptions = JSON.parse(options);
		} catch {
			continue;
		}

		if (parsedOptions && parsedOptions.imageToken) {
			parsedOptions.staticAccessToken = parsedOptions.imageToken;
			delete parsedOptions.imageToken;

			await knex('directus_fields')
				.update({ options: JSON.stringify(parsedOptions) })
				.where({ id });
		}
	}
}

export async function down(knex: Knex): Promise<void> {
	const fields = await knex
		.select<{ id: number; options: string }[]>('id', 'options')
		.from('directus_fields')
		.where('interface', '=', 'input-rich-text-html')
		.orWhere('interface', '=', 'input-rich-text-md');

	for (const { id, options } of fields) {
		let parsedOptions;
		try {
			parsedOptions = JSON.parse(options);
		} catch {
			continue;
		}

		if (parsedOptions && parsedOptions.staticAccessToken) {
			parsedOptions.imageToken = parsedOptions.staticAccessToken;
			delete parsedOptions.staticAccessToken;

			await knex('directus_fields')
				.update({ options: JSON.stringify(parsedOptions) })
				.where({ id });
		}
	}
}
