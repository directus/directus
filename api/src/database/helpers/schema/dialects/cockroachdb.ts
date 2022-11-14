import { KNEX_TYPES } from '@directus/shared/constants';
import logger from '../../../../logger';
import { Options, SchemaHelper } from '../types';

export class SchemaHelperCockroachDb extends SchemaHelper {
	async changeToType(
		table: string,
		column: string,
		type: typeof KNEX_TYPES[number],
		options: Options = {}
	): Promise<void> {
		await this.changeToTypeByCopy(table, column, type, options);
	}

	async getVersion(): Promise<{ parsed: number[]; full: string }> {
		const versionData = await this.knex.select(this.knex.raw('version() as version'));
		const versionString = versionData[0]['version'];
		const bannerParts = versionString.split(' ');
		for (const part of bannerParts) {
			if (/^v[0-9]+(\.[0-9]+)+$/.test(part)) {
				return { parsed: part.split('.').map((num: string) => parseInt(num, 10)), full: versionString };
			}
		}
		logger.error('Unable to parse database version string.');
		return { parsed: [], full: versionString };
	}

	constraintName(existingName: string): string {
		const suffix = '_replaced';
		// CockroachDB does not allow for dropping/creating constraints with the same
		// name in a single transaction. reference issue #14873
		if (existingName.endsWith(suffix)) {
			return existingName.substring(0, existingName.length - suffix.length);
		} else {
			return existingName + suffix;
		}
	}
}
