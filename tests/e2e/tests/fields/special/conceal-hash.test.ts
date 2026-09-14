import { randomUUID } from 'node:crypto';
import { createDirectus, createItem, readItems, rest, staticToken } from '@directus/sdk';
import { port } from '@utils/constants.js';
import { useSnapshot } from '@utils/use-snapshot.js';
import { expect, test } from 'vitest';
import type { Schema } from './schema.d.ts';

const api = createDirectus<Schema>(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));
const { collections } = await useSnapshot<Schema>(api);

const marker = randomUUID();

// One article/link pair that has values for both hidden fields, and one that has neither
await api.request(
	createItem(collections.articles, {
		title: marker,
		secret: randomUUID(),
		secret_hash: randomUUID(),
		links: [{ link: marker, secret: randomUUID(), secret_hash: randomUUID() }],
	}),
);

await api.request(
	createItem(collections.articles, {
		title: marker,
		links: [{ link: marker }],
	}),
);

const FIELDS = ['secret', 'secret_hash'] as const;

/** Neither a concealed nor a hashed value can be compared, so only presence checks are allowed. */
const ALLOWED = [
	{ name: '_null', condition: { _null: true }, expected: 1 },
	{ name: '_nnull', condition: { _nnull: true }, expected: 1 },
];

const REJECTED = [
	{ name: '_eq', condition: { _eq: 'b' } },
	{ name: '_contains', condition: { _contains: 'a' } },
	{ name: '_starts_with', condition: { _starts_with: 'c' } },
	{ name: '_ends_with', condition: { _ends_with: 'd' } },
];

for (const field of FIELDS) {
	for (const { name, condition, expected } of ALLOWED) {
		test(`${name} on a ${field} field is allowed`, async () => {
			const articles = await api.request(
				readItems(collections.articles, {
					filter: { _and: [{ title: { _eq: marker } }, { [field]: condition }] } as any,
				}),
			);

			expect(articles.length).toBe(expected);
		});

		test(`${name} on a ${field} field through a relation is allowed`, async () => {
			const articles = await api.request(
				readItems(collections.articles, {
					filter: { _and: [{ title: { _eq: marker } }, { links: { [field]: condition } }] } as any,
				}),
			);

			expect(articles.length).toBe(expected);
		});
	}

	for (const { name, condition } of REJECTED) {
		test(`${name} on a ${field} field is rejected`, async () => {
			await expect(
				api.request(readItems(collections.articles, { filter: { [field]: condition } as any })),
			).rejects.toMatchObject({ errors: [{ extensions: { code: 'INVALID_QUERY' } }] });
		});

		test(`${name} on a ${field} field through a relation is rejected`, async () => {
			await expect(
				api.request(readItems(collections.articles, { filter: { links: { [field]: condition } } as any })),
			).rejects.toMatchObject({ errors: [{ extensions: { code: 'INVALID_QUERY' } }] });
		});
	}
}

test('a concealed value is still returned to an admin', async () => {
	const articles = await api.request(
		readItems(collections.articles, {
			filter: { _and: [{ title: { _eq: marker } }, { secret: { _nnull: true } }] } as any,
			fields: ['secret', 'secret_hash'],
		}),
	);

	expect(articles[0]!.secret).toEqual(expect.any(String));
	// A hashed value is stored hashed, never as the value that was sent
	expect(String(articles[0]!.secret_hash)).toMatch(/^\$argon2/);
});
