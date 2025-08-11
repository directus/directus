import { expect, test } from 'vitest';
import { createDirectus, rest, staticToken, schemaApply, schemaDiff, createItem, readCollections } from '@directus/sdk';
import { readFile } from 'fs/promises';
import { join } from 'path';

test('ABC', async () => {
	const directus = createDirectus(`http://localhost:${process.env['PORT']}`).with(rest()).with(staticToken('admin'));

	const collections = (await directus.request(readCollections())).map((c) => c.collection);

	if (!collections.includes('fields')) {
		const snapshot = await readFile(join(import.meta.dirname, 'fields.snapshot.json'), { encoding: 'utf8' });
		const diff = await directus.request(schemaDiff(JSON.parse(snapshot), true));
		if (diff) await directus.request(schemaApply(diff));
	}

	const result = await directus.request(
		createItem('fields', {
			big_integer: '1321931',
			boolean: false,
			date: '2025-08-11',
			date_time: '2025-08-11T13:24:35',
			decimal: 48832,
			float: 2.0,
			integer: 1,
			string: 'hello',
			text: 'lorem ipsum',
			time: process.env['DATABASE'] === 'oracle' ? '11:10:590' : '11:10:59',
			timestamp: '2025-08-11T11:25:30.000Z',
			uuid: '1bc5500a-762e-420c-baff-6359ea42c36b',
		}),
	);

	expect(result).toMatchObject({
		boolean: false,
		date: '2025-08-11',
		date_time: '2025-08-11T13:24:35',
		float: 2,
		integer: 1,
		string: 'hello',
		text: 'lorem ipsum',
		time: process.env['DATABASE'] === 'oracle' ? '-010095-01-28T16:19:15.000Z' : '11:10:59',
	});

	expect(String(result.uuid).toLocaleLowerCase()).toEqual('1bc5500a-762e-420c-baff-6359ea42c36b');
	expect(String(result.timestamp).startsWith('2025-08-11T11:25:30'));
	expect(Number(result.big_integer)).toEqual(1321931);
	expect(Number(result.decimal)).toEqual(48832);
});
