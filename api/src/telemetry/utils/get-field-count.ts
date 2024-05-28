import { type Knex } from 'knex';

export interface FieldCount {
	max: number;
	total: number;
}

export const getFieldCount = async (db: Knex): Promise<FieldCount> => {
	const query = <{ max?: number | string; total?: number | string } | undefined>(
		await db
			.max({ max: 'field_count' })
			.sum({ total: 'field_count' })
			.from(db.select('collection').count('* as field_count').from('directus_fields').groupBy('collection').as('inner'))
			.first()
	);

	return {
		max: query?.max ? Number(query.max) : 0,
		total: query?.total ? Number(query.total) : 0,
	};
};
