import jestOpenAPI from 'jest-openapi';
import axios from 'axios';
import path from 'path';
import { api } from './api';

jestOpenAPI(path.join(__dirname, 'openapi.json'));

const collection = 'streets';

describe('Items', function () {
	it('GET /items/{collection}', async function () {
		const res = await axios.get(`${api}/items/${collection}?access_token=admin`);

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});

	var item_id: number;

	it('POST /items/{collection}', async function () {
		const res = await axios.post(`${api}/items/${collection}?access_token=admin`, {
			name: 'Test street',
		});

		item_id = res.data.data.id;

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});

	it('GET /items/{collection}/{id}', async function () {
		const res = await axios.get(`${api}/items/${collection}/${item_id}?access_token=admin`);

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});

	it('PATCH /items/{collection}/{id}', async function () {
		const res = await axios.patch(`${api}/items/${collection}/${item_id}?access_token=admin`, {
			name: 'Some other Street',
		});

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});

	it('DELETE /items/{collection}/{id}', async function () {
		const res = await axios.delete(`${api}/items/${collection}/${item_id}?access_token=admin`);

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});
});
