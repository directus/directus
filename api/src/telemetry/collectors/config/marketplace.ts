import { DEFAULT_REGISTRY } from '@directus/extensions-registry';
import type { TelemetryReport } from '../../types/report.js';

export function collectMarketplace(env: Record<string, unknown>): TelemetryReport['config']['marketplace'] {
	const trust = env['MARKETPLACE_TRUST'] === 'all' ? 'all' : 'sandbox';

	const registry = env['MARKETPLACE_REGISTRY'] && typeof env['MARKETPLACE_REGISTRY'] === 'string' && env['MARKETPLACE_REGISTRY'] !== DEFAULT_REGISTRY ? 'custom' : 'default';

	return { trust, registry };
}
