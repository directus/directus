import logger from '../../../../logger';
import { SchemaHelper } from '../types';

export class SchemaHelperMySQL extends SchemaHelper {
	async getVersion(): Promise<{ parsed: string; full: string }> {
		const versionData = await this.knex.select(this.knex.raw('@@version as version'));
		const versionString = versionData[0]['version'];
		if (/MariaDB/i.test(versionString)) {
			const bannerParts = versionString.split('-');
			for (const part of bannerParts) {
				if (/^[0-9]+(\.[0-9]+)+$/.test(part)) {
					return { parsed: part, full: versionString };
				}
			}
			logger.error('Unable to parse database version string.');
			return { parsed: '-', full: versionString };
		}
		// classic mysql returns a clean version number
		return { parsed: versionString, full: versionString };
	}
}
