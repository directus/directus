import { createDirectus, createItem, createItems, graphql, rest, staticToken } from '@directus/sdk';
import { port } from '@utils/constants.js';
import { useSnapshot } from '@utils/use-snapshot.js';
import { describe, expect, test } from 'vitest';
import type { Schema } from './schema.d.ts';
import { RULES, snapshot } from './snapshot.js';

const api = createDirectus<Schema>(`http://localhost:${port}`).with(rest()).with(graphql()).with(staticToken('admin'));
const { collections } = await useSnapshot<Schema>(api, snapshot);

describe('GraphQL filter', async () => {
	const words = await api.request(
		createItems(collections.words, [{ word: 'Alpha' }, { word: 'alphabet' }, { word: 'Beta' }]),
	);

	const ids = words.map((item) => item.id);

	test.each([
		['_ieq', 'ALPHA', ['Alpha']],
		['_nieq', 'ALPHA', ['alphabet', 'Beta']],
		['_icontains', 'LPH', ['Alpha', 'alphabet']],
		['_nicontains', 'LPH', ['Beta']],
		['_istarts_with', 'ALP', ['Alpha', 'alphabet']],
		['_nistarts_with', 'ALP', ['Beta']],
		['_iends_with', 'BET', ['alphabet']],
		['_niends_with', 'BET', ['Alpha', 'Beta']],
	])('%s', async (operator, value, expected) => {
		const result = await api.query<any>(`
			query {
				${collections.words}(
					filter: { _and: [{ id: { _in: ${JSON.stringify(ids)} } }, { word: { ${operator}: "${value}" } }] }
					sort: ["id"]
				) { word }
			}
		`);

		expect(result[collections.words].map((item: any) => item.word)).toEqual(expected);
	});
});

describe('Field validation', () => {
	const VALUES: Record<keyof typeof RULES, { valid: string; invalid: string }> = {
		ieq: { valid: 'ALPHA', invalid: 'Alphabet' },
		nieq: { valid: 'Beta', invalid: 'aLPHA' },
		icontains: { valid: 'ALPHA', invalid: 'Beta' },
		nicontains: { valid: 'Beta', invalid: 'ALPHA' },
		istarts_with: { valid: 'ALPHA', invalid: 'Beta' },
		nistarts_with: { valid: 'Beta', invalid: 'ALPHA' },
		iends_with: { valid: 'ALPHA', invalid: 'Beta' },
		niends_with: { valid: 'Beta', invalid: 'ALPHA' },
	};

	const createValidated = (payload: Record<string, unknown>) =>
		fetch(`http://localhost:${port}/items/${collections.validated}`, {
			method: 'POST',
			headers: { Authorization: 'Bearer admin', 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		});

	test.each(Object.entries(VALUES))('_%s', async (field, { valid, invalid }) => {
		const item = await api.request(createItem(collections.validated, { [field]: valid }));

		expect(item).toMatchObject({ [field]: valid });

		const response = await createValidated({ [field]: invalid });

		expect(response.status).toBe(400);

		expect(await response.json()).toMatchObject({
			errors: [{ extensions: { code: 'FAILED_VALIDATION', field, type: field } }],
		});
	});

	test.each(Object.keys(VALUES))('_%s with non-string value does not error', async (field) => {
		for (const value of [5, true, null]) {
			const response = await createValidated({ [field]: value });

			expect(response.status, `${JSON.stringify(value)}`).not.toBe(500);
		}
	});
});
