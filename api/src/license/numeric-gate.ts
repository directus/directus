import { LimitExceededError } from '@directus/errors';
import type { NumericGate } from './types.js';

export function getNumericEntitlementLimit(entitlement: NumericGate): number | null {
	if (entitlement.hard_limit !== undefined && entitlement.hard_limit !== null) {
		return entitlement.hard_limit;
	}

	if (entitlement.limit === null) {
		return null;
	}

	if (entitlement.is_overage_allowed === true) {
		return null;
	}

	return entitlement.limit;
}

export function validateNumericEntitlementLimit(options: {
	entitlement: NumericGate;
	current: number;
	delta?: number;
	category: string;
	limit_type?: 'license';
}): void {
	const limit = getNumericEntitlementLimit(options.entitlement);

	if (limit === null) return;

	const delta = options.delta ?? 0;

	if (options.current + delta > limit) {
		throw new LimitExceededError({
			category: options.category,
			...(options.limit_type ? { limit_type: options.limit_type } : {}),
		});
	}
}
