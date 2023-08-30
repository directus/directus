import { expect, test } from 'vitest';
import { transformChunk } from './expand.js';

test('expand', () => {
	const res = transformChunk(
		{
			'users.id': 1,
			'users.first_name': 'John',
			'users.last_name': 'Doe',
		},
		new Map([
			['users.id', ['users', 'id']],
			['users.first_name', ['users', 'first_name']],
			['users.last_name', ['users', 'last_name']],
		])
	);

	expect(res).toEqual({
		users: {
			id: 1,
			first_name: 'John',
			last_name: 'Doe',
		},
	});
});
