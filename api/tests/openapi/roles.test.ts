import jestOpenAPI from 'jest-openapi';
import axios from 'axios';
import path from 'path';
import { api } from './api';

jestOpenAPI(path.join(__dirname, 'openapi.json'));

describe('Roles', function () {
	it('GET /roles', async function () {
		const res = await axios.get(`${api}/roles?access_token=admin`);

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});

	var role_id: string;

	it('POST /roles', async function () {
		const res = await axios.post(`${api}/roles?access_token=admin`, {
			name: 'test_role',
		});

		role_id = res.data.data.id;

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});

	it('GET /roles/{id}', async function () {
		const res = await axios.get(`${api}/roles/${role_id}?access_token=admin`);

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});

	it('PATCH /roles/{id}', async function () {
		const res = await axios.patch(`${api}/roles/${role_id}?access_token=admin`, {
			description: 'This is a description',
		});

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});

	it('DELETE /roles/{id}', async function () {
		const res = await axios.delete(`${api}/roles/${role_id}?access_token=admin`);

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});
});
