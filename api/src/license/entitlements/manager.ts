import { LimitExceededError, ResourceRestrictedError } from '@directus/errors';
import type { AppEntitlements, CountableEntitlementKey, 
	EntitlementCheckResult,
	Entitlements,
	FeatureFlagCheckResult,
	FeatureFlagEntitlementKey,
	FeatureFlagValidator,
	License,
	NumericEntitlementKey,
	UsageCounter } from '@directus/license';
import { CORE_LICENSE, COUNTABLE_ENTITLEMENT_KEYS  } from '@directus/license';

export class EntitlementManager {
	private entitlements: Entitlements = CORE_LICENSE['entitlements'];
	private counterSources = new Map<CountableEntitlementKey, UsageCounter>();
	private validatorSources = new Map<FeatureFlagEntitlementKey, FeatureFlagValidator>();

	/**
	 * Replace the active license. Pass `null` to reset to the core license.
	 */
	setLicense(license: License | null): void {
		this.entitlements = license?.entitlements ?? CORE_LICENSE['entitlements'];
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
			throw new Error(`Validator already registered for entitlement "${String(key)}"`);
		}

		this.validatorSources.set(key, validator);
	}

	/**
	 * Resolve the validity of a feature flag by invoking its registered
	 * validator. Throws if no validator has been registered for `key`.
	 */
	async isValid(key: FeatureFlagEntitlementKey): Promise<boolean> {
		const validator = this.validatorSources.get(key);

		if (!validator) {
			throw new Error(`No validator registered for entitlement "${String(key)}"`);
		}

		return await validator();
	}

	/**
	 * Returns the resolved values of app-only entitlements as a single bundle
	 * for exposure to the client. The package does not enforce these — the app
	 * uses them to adapt its UI (production indicator, powered-by branding).
	 */
	getAppEntitlements(): AppEntitlements {
		const { production_enabled, display_powered_by } = this.entitlements;
		return {
			production_enabled: production_enabled.override ?? production_enabled.default,
			display_powered_by,
		};
	}

	/**
	 * Returns the effective hard limit (`limit + overage + addon`) for a numeric
	 * entitlement, or `null` if any term is `-1` (unlimited, by convention).
	 */
	getEntitlementLimit(key: NumericEntitlementKey): number | null {
		const { limit, overage, addon } = this.entitlements[key];
		if (limit === -1 || overage === -1 || addon === -1) return null;
		return limit + (overage ?? 0) + (addon ?? 0);
	}

	/**
	 * Wire up a usage counter function for a countable entitlement.
	 */
	registerCounter(key: CountableEntitlementKey, source: UsageCounter): void {
		if (this.counterSources.has(key)) {
			throw new Error(`Usage source already registered for entitlement "${String(key)}"`);
		}

		this.counterSources.set(key, source);
	}

	/**
	 * Resolve current usage for a countable entitlement by invoking the
	 * registered source. Throws if no source has been registered for `key`.
	 */
	async getUsage(key: CountableEntitlementKey): Promise<number> {
		const source = this.counterSources.get(key);

		if (!source) {
			throw new Error(`No usage source registered for entitlement "${String(key)}"`);
		}

		return await source();
	}

	/**
	 * Non-throwing variant of `assert`. For countable entitlements: returns
	 * limit / usage / remaining / allowed. For feature flags: returns the
	 * validator's verdict (`valid`) and the license-side `entitled` state.
	 */
	check(
		key: CountableEntitlementKey,
		opts?: { adding?: number, removing?: number },
	): Promise<EntitlementCheckResult>;

	check(key: FeatureFlagEntitlementKey): Promise<FeatureFlagCheckResult>;
	async check(
		key: CountableEntitlementKey | FeatureFlagEntitlementKey,
		opts?: { adding?: number, removing?: number },
	): Promise<EntitlementCheckResult | FeatureFlagCheckResult> {
		if (this.isCountableKey(key)) {
			const hardLimit = this.getEntitlementLimit(key);

			if (hardLimit === null) {
				return { allowed: true, hardLimit: null, usage: 0, remaining: null };
			}

			const usage = await this.getUsage(key);
			const adding = opts?.adding ?? 0;

			return {
				allowed: usage + adding <= hardLimit,
				hardLimit,
				usage,
				remaining: hardLimit - usage,
			};
		}

		return { valid: await this.isValid(key), entitled: this.isEntitled(key) };
	}

	/**
	 * Throws when an entitlement is being violated. Countable: throws
	 * `LimitExceededError` when `usage + (adding ?? 0) > hardLimit`. Feature
	 * flag: throws `FeatureFlagViolatedError` when the registered validator
	 * reports the entitlement is broken.
	 */
	assert(key: CountableEntitlementKey, opts?: { adding?: number, removing?: number }): Promise<void>;
	assert(key: FeatureFlagEntitlementKey): Promise<void>;
	async assert(
		key: CountableEntitlementKey | FeatureFlagEntitlementKey,
		opts?: { adding?: number },
	): Promise<void> {
		if (this.isCountableKey(key)) {
			const hardLimit = this.getEntitlementLimit(key);
			if (hardLimit === null) return;

			const usage = await this.getUsage(key);
			const adding = opts?.adding ?? 0;

			if (usage + adding > hardLimit) {
				throw new LimitExceededError({ category: key }/*{ key, hardLimit, usage, adding }*/);
			}

			return;
		}

		if (!(await this.isValid(key))) {
			throw new ResourceRestrictedError({ category: key });
		}
	}

	private isCountableKey(
		key: CountableEntitlementKey | FeatureFlagEntitlementKey,
	): key is CountableEntitlementKey {
		return COUNTABLE_ENTITLEMENT_KEYS.includes(key as CountableEntitlementKey);
	}
}

export const entitlementManager = new EntitlementManager();
