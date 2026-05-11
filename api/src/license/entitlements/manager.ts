import { LimitExceededError, ResourceRestrictedError } from '@directus/errors';
import type {
	AppEntitlements,
	CountableEntitlementKey,
	EntitlementCheckResult,
	EntitlementResolver,
	Entitlements,
	FeatureFlagCheckResult,
	FeatureFlagEntitlementKey,
	FeatureFlagValidator,
	NumericEntitlementKey,
	ResolveInput,
	UsageCounter,
} from '@directus/license';
import { CORE_LICENSE, COUNTABLE_ENTITLEMENT_KEYS, FEATURE_FLAG_ENTITLEMENT_KEYS } from '@directus/license';
import type { Knex } from 'knex';
import { countActiveCollections, resolveCollections } from './lib/collections.js';
import { checkCustomLLM } from './lib/custom_llms_enabled.js';
import { checkCustomPermissionRules } from './lib/custom_permission_rules_enabled.js';
import { countActiveFlows, resolveFlows } from './lib/flows.js';
import { countActiveSeats, resolveSeats } from './lib/seats.js';
import { checkUsersSSO, resolveSSOUsers } from './lib/sso_enabled.js';

let entitlementManager: EntitlementManager | undefined;

export function getEntitlementManager(): EntitlementManager {
	if (!entitlementManager) {
		entitlementManager = new EntitlementManager();
	}

	return entitlementManager;
}

export class EntitlementManager {
	private entitlements: Entitlements = CORE_LICENSE['entitlements'];
	private counterSources = new Map<CountableEntitlementKey, UsageCounter>();
	private validatorSources = new Map<FeatureFlagEntitlementKey, FeatureFlagValidator>();
	private resolverSources = new Map<keyof ResolveInput, EntitlementResolver<any>>();

	initialize() {
		// countable limits
		this.registerCounter('collections', countActiveCollections);
		this.registerCounter('seats', countActiveSeats);
		this.registerCounter('flows', countActiveFlows);

		// features gates
		this.registerValidator('sso_enabled', checkUsersSSO);
		this.registerValidator('custom_llms_enabled', checkCustomLLM);
		this.registerValidator('custom_permission_rules_enabled', checkCustomPermissionRules);

		// resolvers
		this.registerResolver('collections', resolveCollections);
		this.registerResolver('seats', resolveSeats);
		this.registerResolver('flows', resolveFlows);
		this.registerResolver('sso_enabled', resolveSSOUsers);
	}

	/**
	 * Replace the active license. Pass `null` to reset to the core license.
	 */
	setEntitlements(entitlements: Entitlements | null): void {
		this.entitlements = entitlements ?? CORE_LICENSE['entitlements'];
	}

	/**
	 * Returns whether a feature flag is enabled, applying `override` when
	 * present and falling back to `default` otherwise.
	 */
	isEntitled(key: FeatureFlagEntitlementKey): boolean {
		const entitlement = this.entitlements[key];
		return entitlement.override ?? entitlement.default;
	}

	/**
	 * Wire up a validator function for a feature flag entitlement.
	 */
	registerValidator(key: FeatureFlagEntitlementKey, validator: FeatureFlagValidator): void {
		if (this.validatorSources.has(key)) {
			throw new Error(`Validator was already registered for entitlement "${String(key)}"`);
		}

		this.validatorSources.set(key, validator);
	}

	/**
	 * Resolve the validity of a feature flag by invoking its registered
	 * validator. Throws if no validator has been registered for `key`.
	 */
	async isValid(key: FeatureFlagEntitlementKey, opts?: { knex?: Knex | undefined }): Promise<boolean> {
		const validator = this.validatorSources.get(key);

		if (!validator) {
			throw new Error(`No validator registered for entitlement "${String(key)}"`);
		}

		return await validator(opts);
	}

	/**
	 * Returns the resolved values of app-only entitlements as a single bundle
	 * for exposure to the client. The package does not enforce these — the app
	 * uses them to adapt its UI (production indicator, powered-by branding).
	 */
	getAppEntitlements(): AppEntitlements {
		const { production_enabled, display_powered_by, ai_translations_enabled } = this.entitlements;
		return {
			production_enabled: production_enabled.override ?? production_enabled.default,
			ai_translations_enabled: ai_translations_enabled.override ?? ai_translations_enabled.default,
			display_powered_by,
		};
	}

	/**
	 * Returns the effective hard limit (`limit + overage + addon`) for a numeric
	 * entitlement with `-1` denoting unlimited
	 */
	getEntitlementLimit(key: NumericEntitlementKey): number {
		const { limit, overage, addon } = this.entitlements[key];
		if (limit === -1 || overage === -1 || addon === -1) return -1;
		return limit + (overage ?? 0) + (addon ?? 0);
	}

	/**
	 * Wire up a usage counter function for a countable entitlement.
	 */
	registerCounter(key: CountableEntitlementKey, source: UsageCounter): void {
		if (this.counterSources.has(key)) {
			throw new Error(`Counter was already registered for entitlement "${String(key)}"`);
		}

		this.counterSources.set(key, source);
	}

	/**
	 * Wire up a resolver function for an entitlement.
	 */
	registerResolver<K extends keyof ResolveInput>(key: K, source: EntitlementResolver<K>) {
		if (this.resolverSources.has(key)) {
			throw new Error(`Resolver was already registered for entitlement "${String(key)}"`);
		}

		this.resolverSources.set(key, source as EntitlementResolver<any>);
	}

	/**
	 * Resolve current usage for a countable entitlement by invoking the
	 * registered source. Throws if no source has been registered for `key`.
	 */
	async getUsage(key: CountableEntitlementKey, opts?: { knex?: Knex | undefined }): Promise<number> {
		const source = this.counterSources.get(key);

		if (!source) {
			throw new Error(`No usage source registered for entitlement "${String(key)}"`);
		}

		return await source(opts);
	}

	/**
	 * Non-throwing variant of `assert`. For countable entitlements: returns
	 * limit / usage / remaining / allowed. For feature flags: returns the
	 * validator's verdict (`valid`) and the license-side `entitled` state.
	 */
	check(key: CountableEntitlementKey, opts?: { adding?: number; removing?: number, knex?: Knex | undefined }): Promise<EntitlementCheckResult>;

	check(key: FeatureFlagEntitlementKey, opts?: { knex?: Knex | undefined }): Promise<FeatureFlagCheckResult>;
	async check(
		key: CountableEntitlementKey | FeatureFlagEntitlementKey,
		opts?: { adding?: number; removing?: number, knex?: Knex | undefined },
	): Promise<EntitlementCheckResult | FeatureFlagCheckResult> {
		if (this.isCountableKey(key)) {
			const hardLimit = this.getEntitlementLimit(key);

			if (hardLimit === -1) {
				return { allowed: true, hardLimit: -1, usage: 0, remaining: null };
			}

			const usage = await this.getUsage(key, { knex: opts?.knex });
			const adding = opts?.adding ?? 0;

			return {
				allowed: usage + adding <= hardLimit,
				hardLimit,
				usage,
				remaining: hardLimit - usage,
			};
		}

		const entitled = this.isEntitled(key);

		if (!entitled) {
			return { valid: await this.isValid(key, { knex: opts?.knex }), entitled };
		} else {
			// if you're entitled to a feature then its always valid/within the limit
			return { valid: true, entitled };
		}
	}

	/**
	 * Throws when an entitlement is being violated.
	 *
	 * Countable: throws `LimitExceededError` when `usage + (adding ?? 0) > hardLimit`
	 * Feature flag: throws `ResourceRestrictedError` when its validator indicates invalid
	 */
	assert(key: CountableEntitlementKey, opts?: { adding?: number; removing?: number, knex?: Knex | undefined }): Promise<void>;
	assert(key: FeatureFlagEntitlementKey, opts?: { knex?: Knex | undefined }): Promise<void>;
	async assert(key: CountableEntitlementKey | FeatureFlagEntitlementKey, opts?: { adding?: number, knex?: Knex | undefined }): Promise<void> {
		if (this.isCountableKey(key)) {
			const hardLimit = this.getEntitlementLimit(key);
			if (hardLimit === -1) return;

			const usage = await this.getUsage(key, { knex: opts?.knex });
			const adding = opts?.adding ?? 0;

			if (usage + adding > hardLimit) {
				throw new LimitExceededError({ category: key } /*{ key, hardLimit, usage, adding }*/);
			}

			return;
		}

		if (!this.isEntitled(key) && !(await this.isValid(key, { knex: opts?.knex }))) {
			throw new ResourceRestrictedError({ category: key });
		}
	}

	/**
	 * Checks all entitlements and returns true if all are within the limits
	 */
	async checkAll(): Promise<boolean> {
		for (const key of COUNTABLE_ENTITLEMENT_KEYS) {
			const { allowed } = await this.check(key);
			if (!allowed) return false;
		}

		for (const key of FEATURE_FLAG_ENTITLEMENT_KEYS) {
			const { valid } = await this.check(key);
			if (!valid) return false;
		}

		return true;
	}

	/**
	 * Asserts all entitlements and throws if a limit is breached
	 */
	async assertAll(): Promise<void> {
		for (const key of COUNTABLE_ENTITLEMENT_KEYS) {
			this.assert(key);
		}

		for (const key of FEATURE_FLAG_ENTITLEMENT_KEYS) {
			this.assert(key);
		}
	}

	/**
	 * Apply a resolution payload to an entitlement by invoking its registered
	 * resolver
	 */
	async resolve<K extends keyof ResolveInput>(
		key: K,
		input: NonNullable<ResolveInput[K]>,
		ctx?: { adminId: string },
	): Promise<void> {
		const source = this.resolverSources.get(key);

		if (!source) {
			throw new Error(`No resolver registered for entitlement "${String(key)}"`);
		}

		await source(input, ctx);
	}

	private isCountableKey(key: CountableEntitlementKey | FeatureFlagEntitlementKey): key is CountableEntitlementKey {
		return COUNTABLE_ENTITLEMENT_KEYS.includes(key as CountableEntitlementKey);
	}
}
