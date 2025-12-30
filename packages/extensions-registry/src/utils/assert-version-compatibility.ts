import { SUPPORTED_VERSION } from '../constants.js';
import { getApiVersion } from './get-api-version.js';
import { OutOfDateError } from '@directus/errors';

export interface ValidateApiVersionOptions {
	registry?: string;
}

export const assertVersionCompatibility = async (options?: ValidateApiVersionOptions) => {
	const version = await getApiVersion(options);

	/**
	 * The Registry API always targets the latest release of Directus. If the current installation is
	 * out of date, the registry operations should fail with an instance out-of-date error.
	 */
	if (version !== SUPPORTED_VERSION) {
		throw new OutOfDateError();
	}
};
