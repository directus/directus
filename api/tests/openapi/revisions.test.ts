import jestOpenAPI from 'jest-openapi';
import axios from 'axios';
import path from 'path';
import { api } from './api';

jestOpenAPI(path.join(__dirname, 'openapi.json'));

describe('Revisions', function () {
	var revision_id: number;

	it('GET /revisions', async function () {
		const res = await axios.get(`${api}/revisions?access_token=admin`);

		revision_id = res.data.data[0].id;

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});

	it('GET /revisions/{id}', async function () {
		const res = await axios.get(`${api}/revisions/${revision_id}?access_token=admin`);

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});
});
