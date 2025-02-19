import { getUrl } from '@common/config';
import vendors from '@common/get-dbs-to-test';
import { USER } from '@common/variables';
import request from 'supertest';
import { beforeAll, describe, expect, it, test } from 'vitest';
import { collection, seedDBValues } from './no-relation-II.test.seed';

let isSeeded = false;

beforeAll(async () => {
	isSeeded = await seedDBValues();
}, 300_000);

test('Seed Database Values', () => {
	expect(isSeeded).toStrictEqual(true);
});

describe(`GET /${collection}`, () => {
	describe('retrieves items with filters', () => {
		it.each(vendors)('%s', async (vendor) => {
			const response = await request(getUrl(vendor))
				.get(`/items/${collection}/articles?groupBy=day(date_created)&aggregate[count]=*`)
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

			expect(response.statusCode).toEqual(200);
			expect(response.body.data.length).toBe(1);
		});
	});
});
