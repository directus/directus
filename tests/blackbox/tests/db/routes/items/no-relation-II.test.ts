import { getUrl } from '@common/config';
import vendors from '@common/get-dbs-to-test';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, test } from 'vitest';
import { collection, Result, seedDBValues } from './no-relation-II.test.seed';
import { unseed } from './no-relation-II.test.unseed';

let seedResult: Result = null;

beforeAll(async () => {
	seedResult = await seedDBValues();
}, 300_000);

afterAll(async () => {
	await unseed(seedResult.collection, seedResult.permissions, seedResult.apiToken);
}, 300_000);

test('Seed Database Values', () => {
	expect(seedResult.isSeeded).toStrictEqual(true);
});

describe('retrieves items with filters', () => {
	it.each(vendors)('%s', async (vendor) => {
		const response = await request(getUrl(vendor))
			.get(`/items/${collection}/articles?groupBy=day(date_created)&aggregate[count]=*`)
			.set('Authorization', `Bearer ${seedResult.apiToken}`);

		console.log(response.body);

		expect(response.statusCode).toEqual(200);
		expect(response.body.data.length).toBe(1);
	});
});
