import { URL } from 'url';
import { DEFAULT_REGISTRY } from '../../../constants.js';
import type { DescribeOptions } from '../types/describe-options.js';

export const constructUrl = (id: string, options?: DescribeOptions): URL => {
	const registry = options?.registry ?? DEFAULT_REGISTRY;
	const url = new URL(`/extensions/${id}`, registry);
	return url;
};
