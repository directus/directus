import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex('directus_fields')
		.update({ special: knex.raw(`REPLACE(special, ',', '.')`) })
		.whereIn('special', [
			'geometry,Point',
			'geometry,LineString',
			'geometry,Polygon',
			'geometry,MultiPoint',
			'geometry,MultiLineString',
			'geometry,MultiPolygon',
		]);
}

export async function down(knex: Knex): Promise<void> {
	await knex('directus_fields')
		.update({ special: knex.raw(`REPLACE(special, '.', ',')`) })
		.whereIn('special', [
			'geometry.Point',
			'geometry.LineString',
			'geometry.Polygon',
			'geometry.MultiPoint',
			'geometry.MultiLineString',
			'geometry.MultiPolygon',
		]);
}
