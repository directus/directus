import logger from '../../../../logger';
import { SchemaHelper } from '../types';

export class SchemaHelperPosgreSQL extends SchemaHelper {
	async getVersion(): Promise<string> {
		const versionData = await this.knex.select(this.knex.raw('version() as version'));
		const bannerParts = versionData[0]['version'].split(' ');
		for (const part of bannerParts) {
			if (/^[0-9]+(\.[0-9]+)+$/.test(part)) return part;
		}
		logger.error('Unable to parse database version string.');
		return '-';
	}
}
