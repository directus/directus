import type { Knex } from 'knex';
import { assign, sortBy } from 'lodash-es';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_versions', (table) => {
		table.json('delta');
	});

	const versions = await knex.select('id').from('directus_versions');

	for (const version of versions) {
		const deltas = sortBy(
			await knex.select('id', 'delta').from('directus_revisions').where('version', '=', version.id),
			'id',
		).map((revision) => (typeof revision.delta === 'string' ? JSON.parse(revision.delta) : revision.delta));

		const finalVersionDelta = assign({}, ...deltas);

		await knex('directus_versions')
			.update({ delta: JSON.stringify(finalVersionDelta) })
			.where('id', '=', version.id);
	}
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_versions', (table) => {
		table.dropColumn('delta');
	});
}
