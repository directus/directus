import { CreateCollection, CreateField, DeleteCollection } from '@common/functions';
import vendors from '@common/get-dbs-to-test';
import { it } from 'vitest';

export const c = {
	articles: 'test_items__collection_version_article',
} as const;

const fields = [
	{
		collection: c.articles,
		field: 'title',
		type: 'string',
	},
	{
		collection: c.articles,
		field: 'author',
		type: 'string',
	},
];

export const seedDBStructure = () => {
	it.each(vendors)(
		'%s',
		async (vendor) => {
			// Delete existing collections
			for (const collection of Object.values(c)) {
				await DeleteCollection(vendor, { collection });
			}

			// // Create all collections
			await Promise.all(
				Object.values(c).map((collection) =>
					CreateCollection(vendor, {
						collection: collection,
						primaryKeyType: 'integer',
						meta: {
							versioning: true,
						},
					}),
				),
			);

			await Promise.all(fields.map((field) => CreateField(vendor, field)));
		},
		300000,
	);
};
