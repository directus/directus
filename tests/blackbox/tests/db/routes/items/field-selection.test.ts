import { getUrl } from '@common/config';
import vendors from '@common/get-dbs-to-test';
import { USER } from '@common/variables';
import request from 'supertest';
import { beforeAll, describe, expect, it, test } from 'vitest';
import { collectionName, seedDBValues } from './field-selection.seed';

let isSeeded = false;

beforeAll(async () => {
	isSeeded = await seedDBValues();
}, 300_000);

test('Seed Database Values', () => {
	expect(isSeeded).toStrictEqual(true);
});

describe('Field Selection', () => {
	describe('Array syntax within QUERYSTRING_ARRAY_LIMIT', () => {
		it.each(vendors)('%s', async (vendor) => {
			// Action
			const response = await request(getUrl(vendor))
				.get(`/items/${collectionName}`)
				.query('fields[]=id&fields[]=field_a')
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

			// Assert
			expect(response.statusCode).toEqual(200);
			expect(response.body.data.length).toBeGreaterThanOrEqual(2);

			for (const item of response.body.data) {
				expect(Object.keys(item)).toEqual(expect.arrayContaining(['id', 'field_a']));
				expect(item).not.toHaveProperty('field_b');
				expect(item).not.toHaveProperty('field_c');
			}
		});
	});

	describe('Array syntax exceeding QUERYSTRING_ARRAY_LIMIT', () => {
		it.each(vendors)('%s', async (vendor) => {
			// Action
			// Use array indices beyond the default QUERYSTRING_ARRAY_LIMIT (100)
			// When qs encounters indices > arrayLimit, it parses them as an object instead
			// of an array, which sanitizeFields does not handle — resulting in all fields
			// being returned (the fields parameter is effectively ignored)
			const response = await request(getUrl(vendor))
				.get(`/items/${collectionName}`)
				.query('fields[101]=id&fields[102]=field_a')
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

			// Assert
			expect(response.statusCode).toEqual(200);
			expect(response.body.data.length).toBeGreaterThanOrEqual(2);

			// The fields parameter was not parsed as an array, so field selection is not
			// applied. The response should contain all fields instead of just id and field_a.
			for (const item of response.body.data) {
				expect(item).toHaveProperty('id');
				expect(item).toHaveProperty('field_a');
				expect(item).toHaveProperty('field_b');
				expect(item).toHaveProperty('field_c');
			}
		});
	});

	describe('Comma-separated syntax bypasses QUERYSTRING_ARRAY_LIMIT', () => {
		it.each(vendors)('%s', async (vendor) => {
			// Action
			// Comma-separated fields are parsed as a single string by qs, then split by
			// sanitizeFields — this should not subject to the arrayLimit at all
			const response = await request(getUrl(vendor))
				.get(`/items/${collectionName}`)
				.query('fields=id,' + Array(150).fill('field_a').join(','))
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

			// Assert
			expect(response.statusCode).toEqual(200);
			expect(response.body.data.length).toBeGreaterThanOrEqual(2);

			for (const item of response.body.data) {
				expect(Object.keys(item)).toEqual(expect.arrayContaining(['id', 'field_a']));
				expect(item).not.toHaveProperty('field_b');
				expect(item).not.toHaveProperty('field_c');
			}
		});
	});
});
