import {
	createContentVersion,
	createItem,
	saveToContentVersion,
	schemaApply,
	schemaDiff,
	type DirectusClient,
	type RestClient,
	type StaticTokenClient,
} from '@directus/sdk';
import { readFile } from 'fs/promises';
import type { SetupArgs } from '../../src/index.js';
import { join } from 'path';

export async function createVersion(
	sdk: DirectusClient<any> & RestClient<any> & StaticTokenClient<any>,
	item: string,
	key: string,
	delta: Record<string, any>,
) {
	const version = await sdk.request(
		createContentVersion({
			collection: 'articles',
			item: String(item),
			key,
			name: key,
		}),
	);

	await sdk.request(saveToContentVersion(version['id'], delta));
}

export async function setup({ sdk }: SetupArgs) {
	const schema = JSON.parse(await readFile(join(import.meta.dirname, 'version.json'), { encoding: 'utf-8' }));

	const diff = await sdk.request(schemaDiff(schema, true));
	// Can be null if the DB already matches 1:1 the schema
	if (diff) await sdk.request(schemaApply(diff));

	const item = await sdk.request(
		createItem('articles', {
			title: 'Article 1',
			author: {
				name: 'Author 1',
			},
			links: [
				{
					name: 'Link A',
				},
				{
					name: 'Link B',
				},
			],
			tags: [
				{
					tags_id: {
						tag: 'Tag A',
					},
				},
				{
					tags_id: {
						tag: 'Tag B',
					},
				},
			],
			sections: [
				{
					collection: 'sec_text',
					item: {
						text: 'Text A',
					},
				},
				{
					collection: 'sec_num',
					item: {
						num: 2,
					},
				},
			],
		}),
	);

	await createVersion(sdk, item['id'], 'dev', {
		title: 'Changed',
		author: {
			id: 1,
			name: 'Changed',
		},
		links: [
			{
				id: 1,
				name: 'Link A Changed',
			},
		],
		tags: [
			{
				id: 1,
				tags_id: {
					id: 1,
					tag: 'Tag A Changed',
				},
			},
		],
		sections: [
			{
				id: 1,
				collection: 'sec_text',
				item: {
					id: 1,
					text: 'Text A Changed',
				},
			},
		],
	});
}
