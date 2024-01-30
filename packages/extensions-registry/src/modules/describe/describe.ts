import ky from 'ky';
import { assertVersionCompatibility } from '../../utils/assert-version-compatibility.js';
import { constructUrl } from './lib/construct-url.js';
import { RegistryDescribeResponse } from './schemas/registry-describe-response.js';
import type { DescribeOptions } from './types/describe-options.js';

export type { DescribeOptions } from './types/describe-options.js';

export const describe = async (id: string, options?: DescribeOptions) => {
	await assertVersionCompatibility();
	const url = constructUrl(id, options);
	const response = await ky.get(url).json();
	return await RegistryDescribeResponse.parseAsync(response);
};
