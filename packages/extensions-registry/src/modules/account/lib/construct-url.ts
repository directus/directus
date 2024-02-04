import { DEFAULT_REGISTRY } from '../../../constants.js';
import type { AccountOptions } from '../types/account-options.js';

export const constructUrl = (id: string, options?: AccountOptions) => {
	const registry = options?.registry ?? DEFAULT_REGISTRY;
	const url = new URL(`/accounts/${id}`, registry);
	return url;
};
