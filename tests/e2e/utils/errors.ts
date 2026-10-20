import { expect } from 'vitest';

/**
 * Matches a rejected SDK request carrying a Directus error with the given code, plus any further extensions.
 *
 * @example
 * await expect(api.request(createFlow(flow))).rejects.toMatchObject(directusError('LIMIT_EXCEEDED'));
 * await expect(api.request(updateSettings(settings))).rejects.toMatchObject(
 * 	directusError('RESOURCE_RESTRICTED', { category: 'custom_llms_enabled' }),
 * );
 */
export function directusError(code: string, extensions: Record<string, unknown> = {}) {
	return {
		errors: [expect.objectContaining({ extensions: expect.objectContaining({ code, ...extensions }) })],
	};
}
