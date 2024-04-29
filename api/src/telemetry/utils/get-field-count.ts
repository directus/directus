import { type Knex } from 'knex';

export interface FieldCount {
	max: number;
	total: number;
}

export const getFieldCount = async (db: Knex): Promise<FieldCount> => {
	const counts: FieldCount = {
		max: 0,
		total: 0,
	};

	const result = <{ max: number | string; total: number | string }[]>(
		await db
			.max({ max: 'field_count' })
			.sum({ total: 'field_count' })
			.from(db.select('collection').count('* as field_count').from('directus_fields').groupBy('collection').as('inner'))
	);

	if (result[0]?.max) {
		counts.max = Number(result[0].max);
	}

	if (result[0]?.total) {
		counts.total = Number(result[0].total);
	}

	return counts;
};
