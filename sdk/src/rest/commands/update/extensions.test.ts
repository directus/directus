import { describe, expect, it } from 'vitest';
import { updateExtension } from './extensions.js';

describe('updateExtension', () => {
	it('builds the correct PATCH request for a given UUID', () => {
		const id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
		const data = { meta: { enabled: false } };

		const result = updateExtension(id, data)();

		expect(result).toStrictEqual({
			path: `/extensions/${id}`,
			params: {},
			body: JSON.stringify(data),
			method: 'PATCH',
		});
	});

	it('throws when id is empty', () => {
		expect(() => updateExtension('', {})()).toThrow('Id cannot be empty');
	});
});
