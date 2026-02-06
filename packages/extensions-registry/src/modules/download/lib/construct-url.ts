import { URL } from 'url';
import { DEFAULT_REGISTRY } from '../../../constants.js';
import type { DownloadOptions } from '../types/download-options.js';

/**
 * Constructs a download URL for an extension version from the registry.
 *
 * This function creates a properly formatted URL for downloading a specific
 * extension version from the Directus extensions registry. It supports both
 * production downloads and sandbox mode downloads for testing purposes.
 *
 * @param versionId - The unique identifier of the extension version to download
 * @param requireSandbox - Whether to enable sandbox mode for the download (defaults to false)
 * @param options - Optional configuration for the download request
 * @param options.registry - Custom registry URL to use instead of the default registry
 * @returns A URL object pointing to the download endpoint for the specified version
 *
 * @example
 * ```typescript
 * // Download from default registry
 * const downloadUrl = constructUrl('extension-v1.0.0');
 * console.log(downloadUrl.href); // 'https://registry.directus.io/download/extension-v1.0.0'
 *
 * // Download with sandbox mode enabled
 * const sandboxUrl = constructUrl('extension-v1.0.0', true);
 * console.log(sandboxUrl.href); // 'https://registry.directus.io/download/extension-v1.0.0?sandbox=true'
 *
 * // Download from custom registry
 * const customUrl = constructUrl('extension-v1.0.0', false, {
 *   registry: 'https://custom-registry.example.com'
 * });
 * console.log(customUrl.href); // 'https://custom-registry.example.com/download/extension-v1.0.0'
 *
 * // Combine custom registry with sandbox mode
 * const customSandboxUrl = constructUrl('extension-v1.0.0', true, {
 *   registry: 'https://custom-registry.example.com'
 * });
 * console.log(customSandboxUrl.href);
 * // 'https://custom-registry.example.com/download/extension-v1.0.0?sandbox=true'
 * ```
 */
export const constructUrl = (versionId: string, requireSandbox = false, options?: DownloadOptions): URL => {
	const registry = options?.registry ?? DEFAULT_REGISTRY;
	const url = new URL(`/download/${versionId}`, registry);

	if (requireSandbox) {
		url.searchParams.set('sandbox', 'true');
	}

	return url;
};
