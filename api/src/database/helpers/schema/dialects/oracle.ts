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

	async getVersion(): Promise<{ parsed: number[]; full: string }> {
		const versionData = await this.knex.select('BANNER').fromRaw('V$VERSION').whereRaw("banner LIKE 'Oracle%'");
		const versionString = versionData[0]['BANNER'];
		const bannerParts = versionString.split(' ');
		for (const part of bannerParts) {
			if (/^[0-9]+(\.[0-9]+)+$/.test(part)) {
				return { parsed: part.split('.').map((num: string) => parseInt(num, 10)), full: versionString };
			}
		}
		logger.error('Unable to parse database version string.');
		return { parsed: [], full: versionString };
	}
}
