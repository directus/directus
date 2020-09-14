import jestOpenAPI from 'jest-openapi';
import axios from 'axios';
import path from 'path';
import { api } from './api';

jestOpenAPI(path.join(__dirname, 'openapi.json'));

describe('Folders', function () {
	it('GET /folders', async function () {
		const res = await axios.get(`${api}/folders?access_token=admin`);

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});

	var folder_id: string;

	it('POST /folders', async function () {
		const res = await axios.post(`${api}/folders?access_token=admin`, {
			name: 'Berlin',
		});

		folder_id = res.data.data.id;

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});

	it('GET /folders/{id}', async function () {
		const res = await axios.get(`${api}/folders/${folder_id}?access_token=admin`);

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});

	it('PATCH /folders/{id}', async function () {
		const res = await axios.patch(`${api}/folders/${folder_id}?access_token=admin`, {
			parent_folder: 'e2d1b468-7be9-4bf4-84f6-ea99e132a695',
		});

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});

	it('DELETE /folders/{id}', async function () {
		const res = await axios.delete(`${api}/folders/${folder_id}?access_token=admin`);

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});
});
