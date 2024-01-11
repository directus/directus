import { DEFAULT_REGISTRY } from '../../../constants/default-registry.js';
import type { DescribeOptions } from '../types/describe-options.js';

export const constructUrl = (extension: string, options: Pick<DescribeOptions, 'registry'>) => {
	const url = new URL('/' + extension, options?.registry ?? DEFAULT_REGISTRY);
	return url;
};
