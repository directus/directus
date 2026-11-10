import type { CountableEntitlementKey, Directus, NumericEntitlementKey } from '@directus/license';
import type { Knex } from 'knex';
import type { EntitlementManager } from '../../license/entitlements/manager.js';
import { getEntitlementManager, getLicenseManager } from '../../license/index.js';
import type { CountableEntitlement, TelemetryLicense } from '../types/report.js';

export async function collectLicense(db: Knex): Promise<TelemetryLicense> {
	const licenseManager = getLicenseManager();
	const entitlements = getEntitlementManager();

	const license = await licenseManager.getLicense();

	const [seats, collections, flows] = await Promise.all([
		countableEntitlement(entitlements, license, 'seats', db),
		countableEntitlement(entitlements, license, 'collections', db),
		countableEntitlement(entitlements, license, 'flows', db),
	]);

	const app = entitlements.getAppEntitlements();

	return {
		licensed: licenseManager.getSource() !== null,
		source: licenseManager.getSource(),
		status: await licenseManager.getStatus(),
		invalid_reason: await licenseManager.getInvalidReason(),
		editable: licenseManager.getEditable(),
		name: license.meta.name,
		version: license.meta.version,
		offline: license.meta.offline,
		issued_at: license.meta.issued_at ?? null,
		expires_at: license.meta.expires_at ?? null,
		renews_at: license.meta.renews_at ?? null,
		grace_period: license.meta.grace_period,
		validation_interval: license.meta.validation_interval,
		overage_billed: {
			seats: license.meta.overage_billed?.seats ?? 0,
			collections: license.meta.overage_billed?.collections ?? 0,
			flows: license.meta.overage_billed?.flows ?? 0,
		},
		entitlements: {
			seats,
			collections,
			flows,
			sso_enabled: entitlements.isEntitled('sso_enabled'),
			offline_enabled: entitlements.isEntitled('offline_enabled'),
			telemetry_required: entitlements.isEntitled('telemetry_required'),
			custom_llms_enabled: entitlements.isEntitled('custom_llms_enabled'),
			custom_permission_rules_enabled: entitlements.isEntitled('custom_permission_rules_enabled'),
			production_enabled: app.production_enabled,
			ai_translations_enabled: app.ai_translations_enabled,
			display_powered_by: app.display_powered_by,
			activity_historical_timeframe: passiveLimit(entitlements, 'activity_historical_timeframe'),
			revision_historical_timeframe: passiveLimit(entitlements, 'revision_historical_timeframe'),
		},
	};
}

async function countableEntitlement(
	entitlements: EntitlementManager,
	license: Directus.License,
	key: CountableEntitlementKey,
	db: Knex,
): Promise<CountableEntitlement> {
	const { limit, overage, addon } = license.entitlements[key];
	const hardLimit = entitlements.getEntitlementLimit(key);

	/*
	 * Read usage directly rather than via check(), which short circuits to 0 on unlimited plans and
	 * would report every enterprise instance as idle. These are the same counters the license uses to
	 * enforce the limit, so the report cannot disagree with what the instance actually allows.
	 */
	const usage = await entitlements.getUsage(key, { knex: db });

	return {
		limit: limit === -1 ? null : limit,
		overage: overage ?? 0,
		addon: addon ?? 0,
		hard_limit: hardLimit === -1 ? null : hardLimit,
		usage,
		within_contract: limit === -1 ? true : usage <= limit,
		within_hard_limit: hardLimit === -1 ? true : usage <= hardLimit,
	};
}

function passiveLimit(entitlements: EntitlementManager, key: NumericEntitlementKey): number | null {
	const limit = entitlements.getEntitlementLimit(key);
	return limit === -1 ? null : limit;
}
