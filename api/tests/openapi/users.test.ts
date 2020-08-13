import jestOpenAPI from 'jest-openapi';
import axios from 'axios';
import path from 'path';
import { api } from './api';

jestOpenAPI(path.join(__dirname, 'openapi.json'));

describe('Users', function () {
	it('GET /users/me', async function () {
		const res = await axios.get(`${api}/users/me?access_token=admin`);

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});

	it('PATCH /users/me/tracking/page', async function () {
		const res = await axios.patch(`${api}/users/me/track/page?access_token=admin`, {
			last_page: '/settings',
		});

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});

	it('GET /users', async function () {
		const res = await axios.get(`${api}/users?access_token=admin`);

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});

	let user_id: string;

	it('POST /users', async function () {
		const res = await axios.post(`${api}/users?access_token=admin`, {
			status: 'active',
			role: '2f24211d-d928-469a-aea3-3c8f53d4e426',
			first_name: 'Test',
			last_name: 'User',
			email: 'test@user.com',
			password: 'password',
		});

		user_id = res.data.data.id;

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});

	it('GET /users/{id}', async function () {
		const res = await axios.get(`${api}/users/${user_id}?access_token=admin`);

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});

	it('PATCH /users/{id}', async function () {
		const res = await axios.patch(`${api}/users/${user_id}?access_token=admin`, {
			first_name: 'OtherTest',
		});

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});

	it('DELETE /users/{id}', async function () {
		const res = await axios.delete(`${api}/users/${user_id}?access_token=admin`);

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});
});
