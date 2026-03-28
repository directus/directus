import { ServiceUnavailableError } from '@directus/errors';
import { describe, expect, it } from 'vitest';
import { handleRegistryError } from './handle-registry-error.js';

describe('handleRegistryError', () => {
	it('should handle TimeoutError', () => {
		const err = new Error();
		err.name = 'TimeoutError';

		expect(() => handleRegistryError(err)).toThrow(ServiceUnavailableError);
	});

	it('should handle fetch TypeError', () => {
		const err = new Error('fetch failed');
		err.name = 'TypeError';

		expect(() => handleRegistryError(err)).toThrow(ServiceUnavailableError);
	});

	it('should handle other error', () => {
		expect(() => handleRegistryError(new Error('Aborted operation'))).toThrow(ServiceUnavailableError);
	});

	it('should handle unknown error', () => {
		expect(() => handleRegistryError('thrown string')).toThrow(ServiceUnavailableError);
	});
});
