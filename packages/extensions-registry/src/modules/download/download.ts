import ky from 'ky';
import { assertVersionCompatibility } from '../../utils/assert-version-compatibility.js';
import { constructUrl } from './lib/construct-url.js';
import type { DownloadOptions } from './types/download-options.js';

export type { DownloadOptions } from './types/download-options.js';

export const download = async (versionId: string, options?: DownloadOptions) => {
	await assertVersionCompatibility(options);
	const url = constructUrl(versionId, options);
	const response = await ky.get(url);
	return response.body;
};
