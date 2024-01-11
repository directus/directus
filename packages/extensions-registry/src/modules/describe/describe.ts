import ky from 'ky';
import { constructUrl } from './lib/construct-url.js';
import { convertToDescribeResult } from './lib/convert-to-describe-result.js';
import { RegistryDescribeResponse } from './schemas/registry-describe-response.js';
import type { DescribeOptions } from './types/describe-options.js';
import { validateName } from './utils/validate-name.js';

export const describe = async (extension: string, options: DescribeOptions = {}) => {
	validateName(extension);

	const url = constructUrl(extension, options);

	const rawRegistryResponse = await ky.get(url).json();

	const registryResponse = await RegistryDescribeResponse.parseAsync(rawRegistryResponse);

	return convertToDescribeResult(registryResponse);
};
