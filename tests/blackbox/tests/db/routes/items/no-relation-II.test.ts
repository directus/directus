import { getUrl } from '@common/config';
import vendors from '@common/get-dbs-to-test';
import request from 'supertest';
import { beforeAll, describe, expect, it, test } from 'vitest';
import { collection, type Result, seedDBValues } from './no-relation-II.seed';
import { USER } from '@common/variables';

let seedResult: Result | null = null;

beforeAll(async () => {
	console.log('seed db');
	seedResult = await seedDBValues();
	console.log('seeded db', seedResult.isSeeded);
}, 300_000);

test('Seed Database Values', () => {
	if (seedResult) {
		expect(seedResult.isSeeded).toStrictEqual(true);
		return;
	} else {
		throw new Error('Seed Database Values failed');
	}
});

describe('retrieves items with filters', () => {
	it.each(vendors)('%s', async (vendor) => {
		const response0 = await request(getUrl(vendor))
			.get(`/items/${collection}`)
			.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

		console.log('as admin: ', response0.body.data);

		// const response1 = await request(getUrl(vendor))
		// 	.get(`/items/${collection}`)
		// 	.set('Authorization', `Bearer ${seedResult ? seedResult.editorToken : ''}`);

		// console.log('as editor without filters', response1.body.data, response1);

		// const response = await request(getUrl(vendor))
		// 	.get(`/items/${collection}?groupBy=day(date_created)&aggregate[count]=*`)
		// 	.set('Authorization', `Bearer ${seedResult ? seedResult.editorToken : ''}`);

		// console.log('as editor with filters', response);

		// console.log(JSON.stringify(response, null, 4));

		// expect(response.statusCode).toEqual(200);
		// expect(response.body.data.length).toBe(1);
	});
});
