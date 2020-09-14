import jestOpenAPI from 'jest-openapi';
import axios from 'axios';
import path from 'path';
import { api } from './api';
import { createReadStream } from 'fs'
import FormData from 'form-data'
import fs from 'fs'


jestOpenAPI(path.join(__dirname, 'openapi.json'));

describe('Files', function () {
	it('GET /files', async function () {
		const res = await axios.get(`${api}/files?access_token=admin`);

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});

	var file_id: string;

	it('POST /files', async function () {
		const formData = new FormData();
		formData.append('file.txt', createReadStream('./file.txt'))

		const res = await axios.post(`${api}/files?access_token=admin`, formData, {
			headers: formData.getHeaders()
		});

		
		file_id = res.data.data.id;
		
		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();

		expect(fs.existsSync(`../../uploads/${res.data.data.filename_disk}`)).toBe(true)

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

	// it('DELETE /files/{id}', async function () {
	// 	const res = await axios.delete(`${api}/files/${file_id}?access_token=admin`);

	// 	expect(res.status).toEqual(200);
	// 	expect(res).toSatisfyApiSpec();
	// });
});
