import type { SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import type { OperationMetrics } from '../../types/report.js';
import { countByColumn } from '../../utils/count-by-column.js';
import { serviceCount } from '../../utils/service-count.js';

/**
 * Operation types shipped with Directus. Extensions can register their own, so anything else is
 * counted as custom rather than reported by name.
 */
export const BUILTIN_OPERATION_TYPES = [
	'condition',
	'exec',
	'item-create',
	'item-delete',
	'item-read',
	'item-update',
	'json-web-token',
	'log',
	'mail',
	'notification',
	'request',
	'sleep',
	'throw-error',
	'transform',
	'trigger',
] as const;

export async function collectOperationMetrics(db: Knex, schema: SchemaOverview): Promise<OperationMetrics> {
	const [count, type] = await Promise.all([
		serviceCount(db, schema, 'directus_operations'),
		countByColumn(db, 'directus_operations', 'type', BUILTIN_OPERATION_TYPES),
	]);

	return { count, type };
}
