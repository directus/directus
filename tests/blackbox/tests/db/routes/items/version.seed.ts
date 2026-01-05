import {
	CreateCollection,
	CreateField,
	CreateFieldM2A,
	CreateFieldM2M,
	CreateFieldM2O,
	CreateFieldO2M,
	DeleteCollection,
} from '@common/functions';
import vendors from '@common/get-dbs-to-test';
import { it } from 'vitest';

export const c = {
	articles_tags: 'test_items_version_articles_tags',
	articles_sections: 'test_items_version_articles_sections',
	sec_num: 'test_items_version_articles_sec_num',
	sec_text: 'test_items_version_articles_sec_text',
	tags: 'test_items_version_tags',
	links: 'test_items_version_links',
	articles: 'test_items_version_article',
	users: 'test_items_version_users',
} as const;

const fields = [
	{
		collection: c.articles,
		field: 'title',
		type: 'string',
	},
	{
		collection: c.users,
		field: 'name',
		type: 'string',
	},
	{
		collection: c.links,
		field: 'link',
		type: 'string',
	},
	{
		collection: c.tags,
		field: 'tag',
		type: 'string',
	},
	{
		collection: c.sec_num,
		field: 'num',
		type: 'integer',
	},
	{
		collection: c.sec_text,
		field: 'text',
		type: 'string',
	},
];

export const seedDBStructure = () => {
	it.each(vendors)(
		'%s',
		async (vendor) => {
			console.log({ seed: 'version' });

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

			// Create M2M relationships
			await CreateFieldM2M(vendor, {
				collection: c.articles,
				field: 'tags',
				otherCollection: c.tags,
				otherField: 'articles',
				junctionCollection: c.articles_tags,
				primaryKeyType: 'integer',
			});

			await CreateFieldM2A(vendor, {
				collection: c.articles,
				field: 'sections',
				junctionCollection: c.articles_sections,
				relatedCollections: [c.sec_num, c.sec_text],
				primaryKeyType: 'integer',
			});

			await CreateFieldM2O(vendor, {
				collection: c.articles,
				field: 'author',
				otherCollection: c.users,
			});

			await CreateFieldO2M(vendor, {
				collection: c.articles,
				field: 'links',
				otherCollection: c.links,
				otherField: 'article_id',
			});
		},
		300000,
	);
};
