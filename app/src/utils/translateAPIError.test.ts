import { describe, expect, it } from 'vitest';
import { translateAPIError } from '@/lang';

describe('translateAPIError', () => {
	it('maps INVALID_PASSWORD to the configured translation', () => {
		const apiError = {
			response: {
				data: {
					errors: [{ extensions: { code: 'INVALID_PASSWORD' } }],
				},
			},
		};

		expect(translateAPIError(apiError as any)).toBe("Password doesn't match the configured password policy");
	});
});
