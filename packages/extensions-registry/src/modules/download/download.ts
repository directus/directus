import ky from 'ky';
import { assertVersionCompatibility } from '../../utils/assert-version-compatibility.js';
import { constructUrl } from './lib/construct-url.js';
import type { DownloadOptions } from './types/download-options.js';

export type { DownloadOptions } from './types/download-options.js';

/**
 * Downloads an extension version from the registry as a stream.
 *
 * This function retrieves the binary content of a specific extension version
 * from the Directus extensions registry. It validates API version compatibility
 * and returns a ReadableStream that can be used to process the downloaded content,
 * such as saving to disk or streaming to a client.
 *
 * @param versionId - The unique identifier of the extension version to download
 * @param requireSandbox - Whether to enable sandbox mode for the download (defaults to false)
 * @param options - Optional configuration for the download request
 * @param options.registry - Custom registry URL to use instead of the default registry
 * @returns Promise that resolves to a ReadableStream containing the extension's binary content
 *
 * @throws {Error} When API version compatibility check fails
 * @throws {Error} When the version ID is not found in the registry
 * @throws {Error} When network request fails or registry is unreachable
 * @throws {Error} When the response status indicates an error (4xx, 5xx)
 *
 * @example
 * ```typescript
 * // Download extension from default registry
 * const stream = await download('my-extension-v1.0.0');
 *
 * // Save to file system
 * import { createWriteStream } from 'fs';
 * import { pipeline } from 'stream/promises';
 *
 * const fileStream = createWriteStream('./extension.zip');
 * await pipeline(Readable.fromWeb(stream), fileStream);
 *
 * // Download with sandbox mode enabled
 * const sandboxStream = await download('my-extension-v1.0.0', true);
 *
 * // Download from custom registry
 * const customStream = await download('my-extension-v1.0.0', false, {
 *   registry: 'https://custom-registry.example.com'
 * });
 *
 * // Download with both sandbox and custom registry
 * const customSandboxStream = await download('my-extension-v1.0.0', true, {
 *   registry: 'https://custom-registry.example.com'
 * });
 *
 * // Handle errors
 * try {
 *   const stream = await download('non-existent-version');
 * } catch (error) {
 *   console.error('Download failed:', error.message);
 * }
 * ```
 */
export const download = async (versionId: string, requireSandbox = false, options?: DownloadOptions) => {
	await assertVersionCompatibility(options);
	const url = constructUrl(versionId, requireSandbox, options);
	const response = await ky.get(url);
	return response.body;
};
