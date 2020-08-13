import jestOpenAPI from 'jest-openapi';
import axios from 'axios';
import path from 'path';
import { api } from './api';

jestOpenAPI(path.join(__dirname, 'openapi.json'));

describe('Server', function () {
	it('GET /server/info', async function () {
		const res = await axios.get(`${api}/server/info`);

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});

	it('GET /server/ping', async function () {
		const res = await axios.get(`${api}/server/ping`);

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});
});
