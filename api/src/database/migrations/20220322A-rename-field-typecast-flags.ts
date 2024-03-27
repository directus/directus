import { toArray } from '@directus/utils';
import type { Knex } from 'knex';
import { isArray } from 'lodash-es';

export async function up(knex: Knex): Promise<void> {
	const fields = await knex
		.select<{ id: number; special: string }[]>('id', 'special')
		.from('directus_fields')
		.whereNotNull('special')
		.orWhere('special', '<>', '');

	for (const { id, special } of fields) {
		let parsedSpecial;

		try {
			parsedSpecial = toArray(special);
		} catch {
			continue;
		}

		if (parsedSpecial && isArray(parsedSpecial)) {
			let updateRequired = false;

			parsedSpecial = parsedSpecial.map((special) => {
				switch (special) {
					case 'boolean':
					case 'csv':
					case 'json':
						updateRequired = true;
						return 'cast-' + special;
					default:
						return special;
				}
			});

			if (updateRequired) {
				await knex('directus_fields')
					.update({ special: parsedSpecial.join(',') })
					.where({ id });
			}
		}
	}
}

export async function down(knex: Knex): Promise<void> {
	const fields = await knex
		.select<{ id: number; special: string }[]>('id', 'special')
		.from('directus_fields')
		.whereNotNull('special')
		.orWhere('special', '<>', '');

	for (const { id, special } of fields) {
		let parsedSpecial;

		try {
			parsedSpecial = toArray(special);
		} catch {
			continue;
		}

		if (parsedSpecial && isArray(parsedSpecial)) {
			let updateRequired = false;

			parsedSpecial = parsedSpecial.map((special) => {
				switch (special) {
					case 'cast-boolean':
					case 'cast-csv':
					case 'cast-json':
						updateRequired = true;
						return special.replace('cast-', '');
					default:
						return special;
				}
			});

			if (updateRequired) {
				await knex('directus_fields')
					.update({ special: parsedSpecial.join(',') })
					.where({ id });
			}
		}
	}
}
