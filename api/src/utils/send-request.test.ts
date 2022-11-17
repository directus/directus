import { expect, test } from 'vitest';
import { sendRequest } from './send-request';

test('Returns random activity', async () => {
	const result = await sendRequest({
		url: 'https://www.boredapi.com/api/activity',
		method: 'GET',
	});
	expect(result.status).equal(200);
});
