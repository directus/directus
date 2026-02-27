import type { SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { FlowsService } from '../../../services/flows.js';
import type { TelemetryReport } from '../../types/report.js';

type FlowMetrics = TelemetryReport['metrics']['flows'];

export async function collectFlowMetrics(db: Knex, schema: SchemaOverview): Promise<FlowMetrics> {
	const flowsService = new FlowsService({ knex: db, schema });

	const results = await flowsService.readByQuery({
		aggregate: { countDistinct: ['id'] },
		group: ['status'],
	}) as unknown as { status: string; countDistinct: { id: string } }[];

	let active = 0;
	let inactive = 0;

	for (const row of results) {
		const count = Number(row.countDistinct?.id ?? 0);

		if (row.status === 'active') {
			active = count;
		} else {
			inactive += count;
		}
	}

	return {
		active: { count: active },
		inactive: { count: inactive },
	};
}
