import logger from '../../../../logger';
import { SchemaHelper } from '../types';
import { getDatabaseVersion } from '../../../../database';
import { Knex } from 'knex';

export class SchemaHelperMySQL extends SchemaHelper {
	async getVersion(): Promise<{ parsed: number[]; full: string }> {
		const versionData = await this.knex.select(this.knex.raw('@@version as version'));
		const versionString = versionData[0]['version'];
		if (/MariaDB/i.test(versionString)) {
			const bannerParts = versionString.split('-');
			for (const part of bannerParts) {
				if (/^[0-9]+(\.[0-9]+)+$/.test(part)) {
					return { parsed: part.split('.').map((num: string) => parseInt(num, 10)), full: versionString };
				}
			}
			logger.error('Unable to parse database version string.');
			return { parsed: [], full: versionString };
		}
		// classic mysql returns a clean version number
		return { parsed: versionString.split('.').map((num: string) => parseInt(num, 10)), full: versionString };
	}

	applyMultiRelationalSort(
		knex: Knex,
		dbQuery: Knex.QueryBuilder,
		table: string,
		primaryKey: string,
		orderByString: string,
		orderByFields: Knex.Raw[]
	): Knex.QueryBuilder {
		const [major, minor] = getDatabaseVersion().parsed;
		if (major == 5 && minor === 7) {
			dbQuery.orderByRaw(`?? asc, ${orderByString}`, [`${table}.${primaryKey}`, ...orderByFields]);

			dbQuery = knex
				.select(
					knex.raw(
						`??, ( @rank := IF ( @cur_id = deep.${primaryKey}, @rank + 1, 1 ) ) AS directus_row_number, ( @cur_id := deep.${primaryKey} ) AS current_id`,
						'deep.*'
					)
				)
				.from(knex.raw('? as ??, (SELECT @rank := 0,  @cur_id := null) vars', [dbQuery, 'deep']));

			return dbQuery;
		}

		return super.applyMultiRelationalSort(knex, dbQuery, table, primaryKey, orderByString, orderByFields);
	}
}
