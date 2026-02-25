import { getUrl } from '@common/config';
import { CreateVersion, SaveVersion } from '@common/functions';
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
	});
});
