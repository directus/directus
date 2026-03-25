import { describe, expect, it, vi } from 'vitest';
import type { RequestError } from '@/api';
import { getErrorReason } from './get-error-reason';

vi.mock('@/lang', () => ({
	translateAPIError: vi.fn().mockReturnValue('Unexpected error'),
}));

describe('getErrorReason', () => {
	it('returns extensions.reason when present in the API error', () => {
		const error = {
			response: {
				data: {
					errors: [{ extensions: { reason: 'This invite is no longer valid', code: 'INVALID_PAYLOAD' } }],
				},
			},
		} as unknown as RequestError;

		expect(getErrorReason(error)).toBe('This invite is no longer valid');
	});

	it('falls back to translateAPIError when reason is not present', () => {
		const error = {
			response: {
				data: {
					errors: [{ extensions: { code: 'INVALID_PAYLOAD' } }],
				},
			},
		} as unknown as RequestError;

		expect(getErrorReason(error)).toBe('Unexpected error');
	});

	it('falls back to translateAPIError when errors array is empty', () => {
		const error = {
			response: {
				data: {
					errors: [],
				},
			},
		} as unknown as RequestError;

		expect(getErrorReason(error)).toBe('Unexpected error');
	});
});
