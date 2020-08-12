import jestOpenAPI from 'jest-openapi';
import axios from 'axios';
import path from 'path';
import { api } from './api';

jestOpenAPI(path.join(__dirname, 'openapi.json'));

describe('Utilities', function () {
	it('POST /utils/hash', async function () {
		const res = await axios.post(`${api}/utils/hash`, {
			string: 'test',
		});

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});

	it('POST /utils/hash/verify', async function () {
		const res = await axios.post(`${api}/utils/hash/verify`, {
			hash:
				'$argon2i$v=19$m=4096,t=3,p=1$DbHhm1nACWQHG2tkjm+zXQ$cHl7ISy9xlGWZr35zBteK8PdvBi6FiEEEBv236Wgha0',
			string: 'test',
		});

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});

	it('GET /utils/random/string', async function () {
		const res = await axios.get(`${api}/utils/random/string?length=63`);

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});
});
