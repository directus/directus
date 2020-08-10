import jestOpenAPI from 'jest-openapi';
import axios from 'axios';
import path from 'path';
import { api } from './api';

jestOpenAPI(path.join(__dirname, 'openapi.json'));

describe('Files', function () {
	it('GET /files', async function () {
		const res = await axios.get(`${api}/files?access_token=admin`);

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});

	var file_id: number;

	it('POST /files', async function () {
		const res = await axios.post(`${api}/files?access_token=admin`, {
			uploaded_by: '63716273-0f29-4648-8a2a-2af2948f6f78',
			filename_disk: 'text.txt',
			type: 'text/plain',
			title: 'text',
			storage: 'finder',
		});

		file_id = res.data.data.id;

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});

	it('GET /files/{id}', async function () {
		const res = await axios.get(`${api}/files/${file_id}?access_token=admin`);

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});

	it('PATCH /files/{id}', async function () {
		const res = await axios.patch(`${api}/files/${file_id}?access_token=admin`, {
			description: 'This is a description',
		});

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});

	it('DELETE /files/{id}', async function () {
		const res = await axios.delete(`${api}/files/${file_id}?access_token=admin`);

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});
});
