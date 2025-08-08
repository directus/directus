import { expect, test } from 'vitest';
import { createDirectus, rest, staticToken, readMe } from '@directus/sdk';

test('ABC', async () => {
	const directus = createDirectus('http://localhost:8055').with(rest()).with(staticToken('admin'));

	const result = await directus.request(readMe());

	expect(result.email).toEqual('admin@example.com');
});
