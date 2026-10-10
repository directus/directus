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

	test.each(Object.entries(VALUES))('_%s', async (field, { valid, invalid }) => {
		const item = await api.request(createItem(collections.validated, { [field]: valid }));

		expect(item).toMatchObject({ [field]: valid });

		await expect(api.request(createItem(collections.validated, { [field]: invalid }))).rejects.toMatchObject({
			errors: [{ extensions: { code: 'FAILED_VALIDATION', field } }],
		});
	});
});
