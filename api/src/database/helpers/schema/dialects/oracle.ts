import { KNEX_TYPES } from '@directus/shared/constants';
import logger from '../../../../logger';
import { Options, SchemaHelper } from '../types';

export class SchemaHelperOracle extends SchemaHelper {
	async changeToType(
		table: string,
		column: string,
		type: typeof KNEX_TYPES[number],
		options: Options = {}
	): Promise<void> {
		await this.changeToTypeByCopy(table, column, type, options);
	}

	async getVersion(): Promise<string> {
		const versionData = await this.knex.select('BANNER').fromRaw('V$VERSION').whereRaw("banner LIKE 'Oracle%'");
		const bannerParts = versionData[0]['BANNER'].split(' ');
		for (const part of bannerParts) {
			if (/^[0-9]+(\.[0-9]+)+$/.test(part)) return part;
		}
		logger.error('Unable to parse database version string.');
		return '-';
	}
}
