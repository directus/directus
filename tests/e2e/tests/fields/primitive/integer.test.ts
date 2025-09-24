import { createDirectus, createItem, rest, staticToken } from '@directus/sdk';
import { getHelper } from '@utils/helpers/index.js';
import { useSnapshot } from '@utils/useSnapshot.js';
import { expect, test } from 'vitest';

import { database, port } from '@utils/constants.js';
import { join } from 'path';
import type { Schema } from './schema.js';

const api = createDirectus<Schema>(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));
const { collections } = await useSnapshot<Schema>(api, join(import.meta.dirname, 'snapshot.json'));

const { integer } = getHelper();

for (const n of [1, -1, 0, 499234]) {
	test(`valid integer ${n}`, async () => {
		const result = await api.request(
			createItem(collections.fields, {
				integer: n,
			}),
		);

		expect(result.integer).toEqual(n);
	});
}

test(`valid min integer ${integer.min.toString()}`, async () => {
	const result = await api.request(
		createItem(collections.fields, {
			integer: integer.min.toString(),
		}),
	);

	expect(result.integer).toBeCloseTo(Number(integer.min));
});

test(`valid max integer ${integer.max.toString()}`, async () => {
	const result = await api.request(
		createItem(collections.fields, {
			integer: integer.max.toString(),
		}),
	);

	expect(result.integer).toBeCloseTo(Number(integer.max));
});

for (const n of ['a', integer.min.toString() + '0', (integer.max + '0').toString()]) {
	if (database === 'sqlite' || database === 'cockroachdb') continue;

	test(`invalid integer ${n}`, async () => {
		await expect(async () =>
			api.request(
				createItem(collections.fields, {
					integer: n,
				}),
			),
		).rejects.toThrowError();
	});
}

// BUG: Current bug in CRDB, see https://github.com/directus/directus/issues/25685
if (database === 'cockroachdb') {
	test(`integer overflow on crdb`, async () => {
		const result = await api.request(
			createItem(collections.fields, {
				integer: (integer.max + 1n).toString(),
			}),
		);

		expect(result.integer).toEqual(Number(integer.min));
	});

	test(`integer undeflow on crdb`, async () => {
		const result = await api.request(
			createItem(collections.fields, {
				integer: (integer.min - 1n).toString(),
			}),
		);

		expect(result.integer).toEqual(Number(integer.max));
	});
}
