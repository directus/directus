import jestOpenAPI from 'jest-openapi';
import axios from 'axios';
import path from 'path';
import { api } from './api';

jestOpenAPI(path.join(__dirname, 'openapi.json'));

describe('Presets', function () {
	it('GET /presets', async function () {
		const res = await axios.get(`${api}/presets?access_token=admin`);

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});

	var collection_id: number;

	it('POST /presets', async function () {
		const res = await axios.post(`${api}/presets?access_token=admin`, {
			collection: 'streets',
			title: 'Some test title',
		});

		collection_id = res.data.data.id;

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});

	it('GET /presets/{id}', async function () {
		const res = await axios.get(`${api}/presets/${collection_id}?access_token=admin`);

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});

	it('PATCH /presets/{id}', async function () {
		const res = await axios.patch(`${api}/presets/${collection_id}?access_token=admin`, {
			title: 'Some other title',
		});

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});

	it('DELETE /presets/{id}', async function () {
		const res = await axios.delete(`${api}/presets/${collection_id}?access_token=admin`);

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});
});
