import type { SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { FilesService } from '../../../services/files.js';
import type { FileSizeByType, TelemetryReport } from '../../types/report.js';
import { emptyDistribution } from '../../utils/stats.js';

type FileMetrics = TelemetryReport['metrics']['files'];

interface GroupedFileRow {
	type: string | null;
	countDistinct: { id: string };
	sum: { filesize: string };
	min: { filesize: string };
	max: { filesize: string };
	avg: { filesize: string };
}

const MIME_GROUPS = [
	'image',
	'video',
	'audio',
	'application',
	'font',
	'haptics',
	'message',
	'model',
	'multipart',
	'text',
	'other',
] as const;

export async function collectFileMetrics(db: Knex, schema: SchemaOverview): Promise<FileMetrics> {
	const filesService = new FilesService({ knex: db, schema });

	const types: Record<string, FileSizeByType> = {};

	for (const group of MIME_GROUPS) {
		types[group] = { count: 0, size: emptyDistribution() };
	}

	const grouped = await filesService.readByQuery({
		aggregate: { countDistinct: ['id'], sum: ['filesize'], min: ['filesize'], max: ['filesize'], avg: ['filesize'] },
		group: ['type'],
	}) as unknown as GroupedFileRow[];

	let totalCount = 0;
	let totalSum = 0;
	let totalMin = Infinity;
	let totalMax = 0;

	for (const row of grouped) {
		const prefix = (row.type as string | null)?.split('/')[0] ?? 'other';
		const key = (MIME_GROUPS as readonly string[]).includes(prefix) ? prefix : 'other';
		const count = Number(row.countDistinct?.id ?? 0);
		const min = Number(row.min?.filesize ?? 0);
		const max = Number(row.max?.filesize ?? 0);
		const mean = Number(row.avg?.filesize ?? 0);
		const sum = Number(row.sum?.filesize ?? 0);

		totalCount += count;
		totalSum += sum;
		totalMin = Math.min(totalMin, min);
		totalMax = Math.max(totalMax, max);

		const existing = types[key]!;

		if (existing.count === 0) {
			types[key] = {
				count,
				size: { min, max, median: 0, mean: Math.round(mean) },
			};
		} else {
			const prevCount = existing.count;
			existing.count += count;
			existing.size.min = Math.min(existing.size.min, min);
			existing.size.max = Math.max(existing.size.max, max);
			existing.size.mean = Math.round(((existing.size.mean * prevCount) + (mean * count)) / existing.count);
		}
	}

	return {
		count: totalCount,
		size: {
			sum: totalSum,
			min: totalCount > 0 ? totalMin : 0,
			max: totalMax,
			median: 0,
			mean: totalCount > 0 ? Math.round(totalSum / totalCount) : 0,
		},
		types,
	};
}
