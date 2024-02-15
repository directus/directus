import { DEFAULT_REGISTRY } from '../../../constants.js';
import type { DownloadOptions } from '../types/download-options.js';

export const constructUrl = (versionId: string, requireSandbox = false, options?: DownloadOptions) => {
	const registry = options?.registry ?? DEFAULT_REGISTRY;
	const url = new URL(`/download/${versionId}`, registry);

	if (requireSandbox) {
		url.searchParams.set('sandbox', 'true');
	}

	return url;
};
