import jestOpenAPI from 'jest-openapi';
import axios from 'axios';
import path from 'path';
import { api } from './api';

let refresh_token: string;
let auth_token: string;

jestOpenAPI(path.join(__dirname, 'openapi.json'));

describe('Authentication', function () {
	it('POST /auth/login', async function () {
		const res = await axios.post(api + '/auth/login', {
			email: 'admin@example.com',
			password: 'password',
		});

		auth_token = res.data.data.access_token;
		refresh_token = res.data.data.refresh_token;

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});

	it('POST /auth/refresh', async function () {
		const res = await axios.post(`${api}/auth/refresh`, {
			refresh_token: refresh_token,
		});

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});

	it('POST /auth/logout', async function () {
		const res = await axios.post(`${api}/auth/logout`, {
			refresh_token: refresh_token,
		});

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});
});
