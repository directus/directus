/**
 * @jest-environment node
 */

import { InvalidRefreshTime, NotAuthenticated } from '../src/errors';

describe('errors', function () {
	it(`test errors`, async () => {
		try {
			throw new NotAuthenticated();
		} catch (err) {
			expect(err instanceof Error).toBe(true);
			expect(err instanceof NotAuthenticated).toBe(true);
			expect(err.message).toBe('No authentication');
		}

		try {
			throw new InvalidRefreshTime();
		} catch (err) {
			expect(err instanceof Error).toBe(true);
			expect(err instanceof InvalidRefreshTime).toBe(true);
			expect(err.message).toBe('Invalid authentication refresh time interval');
		}
	});
});
