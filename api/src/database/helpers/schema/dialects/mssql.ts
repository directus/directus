import logger from '../../../../logger';
import { SchemaHelper } from '../types';
import { Knex } from 'knex';

export class SchemaHelperMSSQL extends SchemaHelper {
	applyLimit(rootQuery: Knex.QueryBuilder, limit: number): void {
		// The ORDER BY clause is invalid in views, inline functions, derived tables, subqueries,
		// and common table expressions, unless TOP, OFFSET or FOR XML is also specified.
		if (limit === -1) {
			rootQuery.limit(Number.MAX_SAFE_INTEGER);
		} else {
			rootQuery.limit(limit);
		}
	}

	applyOffset(rootQuery: Knex.QueryBuilder, offset: number): void {
		rootQuery.offset(offset);
		rootQuery.orderBy(1);
	}

	async getVersion(): Promise<{ parsed: number[]; full: string }> {
		const versionData = await this.knex.select(this.knex.raw('@@version as version'));
		const versionString = versionData[0]['version'];
		const bannerParts = versionString.split(' ');
		for (const part of bannerParts) {
			if (/^[0-9]+(\.[0-9]+)+$/.test(part)) {
				return { parsed: part.split('.').map((num: string) => parseInt(num, 10)), full: versionString };
			}
		}
		logger.error('Unable to parse database version string.');
		return { parsed: [], full: versionString };
	}

	formatUUID(uuid: string): string {
		return uuid.toUpperCase();
	}
}
