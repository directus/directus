import { test, expect } from 'vitest';

import { jwtPayload } from '@/utils/jwt-payload';

test('Returns payload as JSON object from JWT', () => {
	const token =
		'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

	const payload = jwtPayload(token);

	expect(payload).toEqual({
		sub: '1234567890',
		name: 'John Doe',
		iat: 1516239022,
	});
});
