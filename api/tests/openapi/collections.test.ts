import jestOpenAPI from 'jest-openapi';
import axios from 'axios';
import path from 'path';
import { api } from './api';

jestOpenAPI(path.join(__dirname, 'openapi.json'));

describe('Collections', function () {
	it('GET /collections', async function () {
		const res = await axios.get(`${api}/collections?access_token=admin`);

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});

	var collection: number;

	it('POST /collections', async function () {
		const res = await axios.post(`${api}/collections?access_token=admin`, {
			"collection": "test_collection",
			"fields": [
				{
					"field": "id",
					"type": "integer",
					"meta": {
						"hidden": true,
						"interface": "numeric",
						"readonly": true
					},
					"schema": {
						"has_auto_increment": true,
						"is_primary_key": true
					}
				}
			]
		});

		collection = res.data.data.collection;

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});

	it('GET /collections/{collection}', async function () {
		const res = await axios.get(`${api}/collections/${collection}?access_token=admin`);

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});

	it('PATCH /collections/{collection}', async function () {
		const res = await axios.patch(`${api}/collections/${collection}?access_token=admin`, {
			"meta": {
				"note": 'This is a note.',
			},
		});

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});

	it('DELETE /collections/{collection}', async function () {
		const res = await axios.delete(`${api}/collections/${collection}?access_token=admin`);

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});
});
