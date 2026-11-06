import { getRedactedString } from '@directus/utils';
import { expect, test } from 'vitest';
import { FLOW_SECRET_KEYS } from './flow-secret-keys.js';
import { redactObject } from './redact-object.js';

test('redacts secrets from event payloads, webhook bodies, and headers, and keeps the rest', () => {
	const data = {
		$trigger: {
			headers: { authorization: 'Bearer secret', 'user-agent': 'kept' },
			body: { token: 'secret', title: 'kept' },
			payload: [{ password: 'secret', title: 'kept' }],
		},
		$last: { query: { access_token: 'secret' } },
	};

	const result = JSON.stringify(redactObject(data, { keys: FLOW_SECRET_KEYS }, getRedactedString));

	expect(result).not.toContain('secret');
	expect(result.match(/kept/g)).toHaveLength(3);
});
