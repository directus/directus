import { parseJSON } from '@directus/utils';
import type { Knex } from 'knex';
import { assign } from 'lodash-es';

export async function up(knex: Knex): Promise<void> {
	const rowsLimit = 50;
	let hasMore = true;

	while (hasMore) {
		const missingDeltaVersions = await knex.select('id').from('directus_versions').whereNull('delta').limit(rowsLimit);

		if (missingDeltaVersions.length === 0) {
			hasMore = false;
			break;
		}

		await knex.transaction(async (trx) => {
			for (const missingDeltaVersion of missingDeltaVersions) {
				const revisions = await trx
					.select('delta')
					.from('directus_revisions')
					.where('version', '=', missingDeltaVersion.id)
					.orderBy('id');

				const deltas = revisions.map((revision) =>
					typeof revision.delta === 'string' ? parseJSON(revision.delta) : (revision.delta ?? {}),
				);

				const consolidatedDelta = assign({}, ...deltas);

				await trx('directus_versions')
					.update({
						delta: JSON.stringify(consolidatedDelta),
					})
					.where('id', '=', missingDeltaVersion.id);
			}
		});
	}
}

export async function down(): Promise<void> {
	// No down migration required
}
