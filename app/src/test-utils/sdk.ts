/**
 * SDK mocking utilities for app tests
 * Provides simplified mocks for @/sdk module used in testing
 */

import { RequestOptions } from '@directus/sdk';
import { vi } from 'vitest';

/**
 * Creates a standard SDK mock for app tests
 * This matches the pattern used across app test files
 *
 * @example
 * Basic usage
 * ```typescript
 * import sdk from '@/sdk';
 *
 * vi.mock('@/sdk', async () => {
 *   const { mockSdk } = await import('@/test-utils/sdk');
 *   return mockSdk();
 * });
 *
 * // Then in your test, control responses:
 * vi.mocked(sdk.request).mockResolvedValue({ id: 1, name: 'Test' });
 * ```
 *
 * @example
 * Custom handler
 * ```typescript
 * vi.mock('@/sdk', async () => {
 *   const { mockSdk } = await import('@/test-utils/sdk');
 *   return mockSdk(({ path }) => {
 *     if (path === '/items/posts/1') {
 *       return Promise.resolve({ id: 1, title: 'Test Post' });
 *     }
 *     return Promise.resolve({ data: [] });
 *   });
 * });
 * ```
 *
 */
export function mockSdk(handler?: (options: RequestOptions) => Promise<unknown>) {
	return {
		default: {
			request: handler ? vi.fn((command) => handler(command())) : vi.fn(),
		},
		requestEndpoint: vi.fn((options) => () => options),
	};
}
