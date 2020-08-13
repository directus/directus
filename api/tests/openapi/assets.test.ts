import jestOpenAPI from 'jest-openapi';
import axios from 'axios';
import path from 'path';
import { api } from './api';

jestOpenAPI(path.join(__dirname, 'openapi.json'));

describe('Assets', function () {
	it('GET /assets/{key}', async function () {
		const files = await axios.get(`${api}/files?access_token=admin`);
		const id = files.data.data[0].id;

		const res = await axios.get(`${api}/assets/${id}`);

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});
});
