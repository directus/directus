import { Knex } from 'knex';

export async function up(knex: Knex) {
	const fields = await knex('directus_fields')
		.select('id', 'options')
		.where('interface', 'wysiwyg')
		.andWhereNot('options', null);
	for (const field of fields) {
		const isString = typeof field.options === 'string';
		const options = isString ? JSON.parse(field.options) : field.options ?? {};

		if ('toolbar' in options && Array.isArray(options.toolbar)) {
			options.toolbar = options.toolbar.map((v: string) =>
				v
					.replace(/^link$/g, 'custom-link')
					.replace(/^media$/g, 'custom-media')
					.replace(/^image$/g, 'custom-image')
			);
			await knex('directus_fields')
				.update({ options: isString ? JSON.stringify(options) : options })
				.where('id', field.id);
		}
	}
}

export async function down(knex: Knex) {
	const fields = await knex('directus_fields')
		.select('id', 'options')
		.where('interface', 'wysiwyg')
		.andWhereNot('options', null);
	for (const field of fields) {
		const isString = typeof field.options === 'string';
		const options = isString ? JSON.parse(field.options) : field.options ?? {};

		if ('toolbar' in options && Array.isArray(options.toolbar)) {
			options.toolbar = options.toolbar.map((v: string) =>
				v
					.replace(/^custom-link$/g, 'link')
					.replace(/^custom-media$/g, 'media')
					.replace(/^custom-image$/g, 'image')
			);
			await knex('directus_fields')
				.update({ options: isString ? JSON.stringify(options) : options })
				.where('id', field.id);
		}
	}
}
