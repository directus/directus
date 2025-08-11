import { expect, test } from 'vitest';
import { createDirectus, rest, staticToken, schemaApply, schemaDiff, createItem } from '@directus/sdk';
import { readFile } from 'fs/promises';
import { join } from 'path';

test('ABC', async () => {
	const directus = createDirectus('http://localhost:8055').with(rest()).with(staticToken('admin'));

	const snapshot = await readFile(join(import.meta.dirname, 'fields.snapshot.json'), { encoding: 'utf8' });
	const diff = await directus.request(schemaDiff(JSON.parse(snapshot), true));
	await directus.request(schemaApply(diff));

	const result = await directus.request(
		createItem('fields', {
			big_integer: 1321931,
			boolean: false,
			date: '2025-08-11',
			date_time: '2025-08-11T13:24:35',
			decimal: 48832,
			float: 2.0,
			integer: 1,
			string: 'hello',
			text: 'lorem ipsum',
			time: '11:10:59',
			timestamp: '2025-08-11T11:25:30.000Z',
			uuid: '1bc5500a-762e-420c-baff-6359ea42c36b',
		}),
	);

	expect(result).toMatchObject({
		big_integer: 1321931,
		boolean: false,
		date: '2025-08-11',
		date_time: '2025-08-11T13:24:35',
		decimal: '48832.00000',
		float: 2,
		integer: 1,
		string: 'hello',
		text: 'lorem ipsum',
		time: '11:10:59',
		timestamp: '2025-08-11T11:25:30.000Z',
		uuid: '1bc5500a-762e-420c-baff-6359ea42c36b',
	});
});
