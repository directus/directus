import ky from 'ky';
import { assertVersionCompatibility } from '../../utils/assert-version-compatibility.js';
import { handleRegistryError } from '../../utils/handle-registry-error.js';
import { constructUrl } from './lib/construct-url.js';
import { RegistryDescribeResponse } from './schemas/registry-describe-response.js';
import type { DescribeOptions } from './types/describe-options.js';

export type { RegistryDescribeResponse } from './schemas/registry-describe-response.js';
export type { DescribeOptions } from './types/describe-options.js';

export const describe = async (id: string, options?: DescribeOptions) => {
	try {
		await assertVersionCompatibility(options);
		const url = constructUrl(id, options);
		const response = await ky.get(url).json();
		return await RegistryDescribeResponse.parseAsync(response);
	} catch (error) {
		handleRegistryError(error);
	}
};
