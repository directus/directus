import jestOpenAPI from 'jest-openapi';
import axios from 'axios';
import path from 'path';
import { api } from './api';

jestOpenAPI(path.join(__dirname, 'openapi.json'));

describe('Relations', function () {
	it('GET /relations', async function () {
		const res = await axios.get(`${api}/relations?access_token=admin`);

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});

	var relation_id: number;

	it('POST /relations', async function () {
		const res = await axios.post(`${api}/relations?access_token=admin`, {
			many_collection: 'houses',
			many_field: 'street',
			many_primary: "id",
			one_collection: 'streets',
			one_field: null,
			one_primary: "id"
		});

		relation_id = res.data.data.id;

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});

	it('GET /relations/{id}', async function () {
		const res = await axios.get(`${api}/relations/${relation_id}?access_token=admin`);

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});

	it('PATCH /relations/{id}', async function () {
		const res = await axios.patch(`${api}/relations/${relation_id}?access_token=admin`, {
			one_field: 'garage',
		});

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});

	it('DELETE /relations/{id}', async function () {
		const res = await axios.delete(`${api}/relations/${relation_id}?access_token=admin`);

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});
});
