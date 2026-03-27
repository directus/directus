import type { SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { TranslationsService } from '../../../services/translations.js';
import type { TelemetryReport } from '../../types/report.js';
import { distributionFromCounts, emptyDistribution } from '../../utils/stats.js';

type TranslationMetrics = TelemetryReport['metrics']['translations'];

export async function collectTranslationMetrics(db: Knex, schema: SchemaOverview): Promise<TranslationMetrics> {
	try {
		const translationsService = new TranslationsService({ knex: db, schema });

		const grouped = (await translationsService.readByQuery({
			aggregate: { count: ['*'] },
			group: ['language'],
		})) as Array<{ language: string; count: string }>;

		const counts = grouped.map((row) => Number(row.count ?? 0));
		const totalTranslations = counts.reduce((sum, value) => sum + value, 0);

		return {
			count: totalTranslations,
			language: {
				count: counts.length,
				translations: distributionFromCounts(counts),
			},
		};
	} catch {
		return {
			count: 0,
			language: {
				count: 0,
				translations: emptyDistribution(),
			},
		};
	}
}
