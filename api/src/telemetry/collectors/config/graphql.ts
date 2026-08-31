import { toArray, toBoolean } from '@directus/utils';
import type { TelemetryConfig } from '../../types/report.js';

export function collectGraphql(env: Record<string, unknown>): TelemetryConfig['graphql'] {
	const singleUseMutations = env['GRAPHQL_SINGLE_USE_MUTATIONS'];

	return {
		introspection: toBoolean(env['GRAPHQL_INTROSPECTION']),
		// Only the size is reported; the entries themselves are operation names the operator chose.
		single_use_mutations: singleUseMutations ? toArray(singleUseMutations as string).length : 0,
	};
}
