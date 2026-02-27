import { randomUUID } from 'node:crypto';
import { getUrl } from '@common/config';
import { CreateItem, CreateVersion, DeleteItem, DeleteVersion, SaveVersion } from '@common/functions';
import vendors from '@common/get-dbs-to-test';
import { USER } from '@common/variables';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { c } from './version-collection.seed';

describe('allow creating version item = null', () => {
	it.each(vendors)('%s', async (vendor) => {
		const response = await request(getUrl(vendor))
			.post(`/versions`)
			.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
			.send({
				collection: c.articles,
				item: null,
				key: 'draft',
				name: 'draft',
			});

		expect(response.body.data).toBeDefined();

		await DeleteVersion(vendor, response.body.data.id);
	});
});

// TODO: Possibly update minimum app permissions as by default you are not allowed to create versions at all at the moment, dunno why?
// describe('allow creating version item = null for non admins', () => {
// 	it.each(vendors)('%s', async (vendor) => {
// 		const response = await request(getUrl(vendor))
// 			.post(`/versions`)
// 			.set('Authorization', `Bearer ${USER.APP_ACCESS.TOKEN}`)
// 			.send({
// 				collection: c.articles,
// 				item: null,
// 				key: 'draft',
// 				name: 'draft',
// 			});

// 		expect(response.body.data).toBeDefined();
// 	});
// });

describe('saving an itemless version', () => {
	it.each(vendors)('%s', async (vendor) => {
		const version = await CreateVersion(vendor, {
			collection: c.articles,
			item: null,
			key: 'draft',
			name: 'draft',
		});

		const response = await request(getUrl(vendor))
			.post(`/versions/${version.id}/save`)
			.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
			.send({
				title: 'title',
			});

		expect(response.body.data).toBeDefined();
		expect(response.body.data.title).toEqual('title');

		await DeleteVersion(vendor, version.id);
	});
});

describe('promoting an itemless version', () => {
	it.each(vendors)('%s', async (vendor) => {
		const version = await CreateVersion(vendor, {
			collection: c.articles,
			item: null,
			key: 'draft',
			name: 'draft',
		});

		await SaveVersion(vendor, {
			id: version.id,
			delta: {
				title: 'title',
			},
		});

		const response = await request(getUrl(vendor))
			.post(`/versions/${version.id}/promote`)
			.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
			.send();

		expect(response.body.data).toBeDefined();

		await DeleteVersion(vendor, version.id);

		await DeleteItem(vendor, {
			collection: c.articles,
			id: response.body.data,
		});
	});
});

describe('deny updating non draft version from item to itemless', () => {
	it.each(vendors)('%s', async (vendor) => {
		const item = await CreateItem(vendor, {
			collection: c.articles,
			item: {
				title: 'item1',
			},
		});

		const version = await CreateVersion(vendor, {
			collection: c.articles,
			item: String(item.id),
			key: 'test',
			name: 'draft',
		});

		await SaveVersion(vendor, {
			id: version.id,
			delta: {
				title: 'title',
			},
		});

		const response = await request(getUrl(vendor))
			.patch(`/versions/${version.id}`)
			.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
			.send({
				item: null,
			});

		expect(response.body.errors).toBeDefined();

		await DeleteVersion(vendor, version.id);

		await DeleteItem(vendor, {
			collection: c.articles,
			id: item.id,
		});
	});
});

describe('deny updating itemless draft version to item(full)', () => {
	it.each(vendors)('%s', async (vendor) => {
		const version = await CreateVersion(vendor, {
			collection: c.articles,
			item: null,
			key: 'draft',
			name: 'draft',
		});

		await SaveVersion(vendor, {
			id: version.id,
			delta: {
				title: 'title',
			},
		});

		const response = await request(getUrl(vendor))
			.patch(`/versions/${version.id}`)
			.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
			.send({
				key: 'test2',
			});

		expect(response.body.errors).toBeDefined();

		await DeleteVersion(vendor, version.id);
	});
});

describe('request version on collection with no drafts', () => {
	it.each(vendors)('%s', async (vendor) => {
		const versionKey = randomUUID();

		const item = await CreateItem(vendor, {
			collection: c.articles,
			item: {
				title: 'item1',
			},
		});

		const response = await request(getUrl(vendor))
			.get(`/items/${c.articles}?version=${versionKey}`)
			.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

		expect(response.body.data).toMatchObject([]);

		await DeleteItem(vendor, {
			collection: c.articles,
			id: item.id,
		});
	});
});

describe('request version on collection a draft item', () => {
	it.each(vendors)('%s', async (vendor) => {
		const versionKey = randomUUID();

		const item = await CreateItem(vendor, {
			collection: c.articles,
			item: {
				title: 'item1',
			},
		});

		const version = await CreateVersion(vendor, {
			collection: c.articles,
			item: String(item.id),
			key: versionKey,
			name: versionKey,
		});

		await SaveVersion(vendor, {
			id: version.id,
			delta: {
				title: 'title',
			},
		});

		const response = await request(getUrl(vendor))
			.get(`/items/${c.articles}?version=${versionKey}`)
			.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

		expect(response.body.data).toMatchObject([
			{
				$meta: {
					delta: {
						title: 'title',
					},
					version_id: version.id,
				},
				author: null,
				id: item.id,
				title: 'title',
			},
		]);

		await DeleteItem(vendor, {
			collection: c.articles,
			id: item.id,
		});

		await DeleteVersion(vendor, version.id);
	});
});

describe('request version on collection a draft itemless', () => {
	it.each(vendors)('%s', async (vendor) => {
		const versionKey = 'draft';

		const version = await CreateVersion(vendor, {
			collection: c.articles,
			item: null,
			key: versionKey,
			name: versionKey,
		});

		await SaveVersion(vendor, {
			id: version.id,
			delta: {
				title: 'title',
			},
		});

		const response = await request(getUrl(vendor))
			.get(`/items/${c.articles}?version=${versionKey}`)
			.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

		expect(response.body.data).toMatchObject([
			{
				$meta: {
					delta: {
						title: 'title',
					},
					version_id: version.id,
				},
				author: null,
				id: null,
				title: 'title',
			},
		]);

		await DeleteVersion(vendor, version.id);
	});
});

describe('request version on collection a draft failed itemless', () => {
	it.each(vendors)('%s', async (vendor) => {
		const versionKey = 'draft';

		const version = await CreateVersion(vendor, {
			collection: c.articles,
			item: null,
			key: versionKey,
			name: versionKey,
		});

		await SaveVersion(vendor, {
			id: version.id,
			delta: {
				title: null,
				author: 'abc',
			},
		});

		const response = await request(getUrl(vendor))
			.get(`/items/${c.articles}?version=${versionKey}`)
			.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

		expect(response.body.data).toMatchObject([
			{
				$meta: {
					error: expect.anything(),
					delta: {
						title: null,
						author: 'abc',
					},
					version_id: version.id,
				},
				author: 'abc',
				title: null,
			},
		]);

		await DeleteVersion(vendor, version.id);
	});
});

describe('request version on collection a failed draft item', () => {
	it.each(vendors)('%s', async (vendor) => {
		const versionKey = randomUUID();

		const item = await CreateItem(vendor, {
			collection: c.articles,
			item: {
				title: 'item1',
			},
		});

		const version = await CreateVersion(vendor, {
			collection: c.articles,
			item: String(item.id),
			key: versionKey,
			name: versionKey,
		});

		await SaveVersion(vendor, {
			id: version.id,
			delta: {
				title: null,
			},
		});

		const response = await request(getUrl(vendor))
			.get(`/items/${c.articles}?version=${versionKey}`)
			.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

		expect(response.body.data).toMatchObject([
			{
				$meta: {
					error: expect.any(Object),
					delta: {
						title: null,
					},
					version_id: version.id,
				},
				author: null,
				id: item.id,
				title: null,
			},
		]);

		await DeleteItem(vendor, {
			collection: c.articles,
			id: item.id,
		});

		await DeleteVersion(vendor, version.id);
	});
});
