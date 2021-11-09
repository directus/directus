import { Knex } from 'knex';
// @ts-ignore
import Client_Oracledb from 'knex/lib/dialects/oracledb';

export async function up(knex: Knex): Promise<void> {
	const specialKey = knex.client instanceof Client_Oracledb ? '"special"' : 'special';
	await knex('directus_fields')
		.update({ special: knex.raw(`REPLACE(${specialKey}, 'geometry,', 'geometry.')`) })
		.where('special', 'like', '%geometry,Point%')
		.orWhere('special', 'like', '%geometry,LineString%')
		.orWhere('special', 'like', '%geometry,Polygon%')
		.orWhere('special', 'like', '%geometry,MultiPoint%')
		.orWhere('special', 'like', '%geometry,MultiLineString%')
		.orWhere('special', 'like', '%geometry,MultiPolygon%');
}

export async function down(knex: Knex): Promise<void> {
	const specialKey = knex.client instanceof Client_Oracledb ? '"special"' : 'special';
	await knex('directus_fields')
		.update({ special: knex.raw(`REPLACE(${specialKey}, 'geometry.', 'geometry,')`) })
		.where('special', 'like', '%geometry.Point%')
		.orWhere('special', 'like', '%geometry.LineString%')
		.orWhere('special', 'like', '%geometry.Polygon%')
		.orWhere('special', 'like', '%geometry.MultiPoint%')
		.orWhere('special', 'like', '%geometry.MultiLineString%')
		.orWhere('special', 'like', '%geometry.MultiPolygon%');
}
