import jestOpenAPI from 'jest-openapi';
import axios from 'axios';
import path from 'path';
import { api } from './api';

jestOpenAPI(path.join(__dirname, 'openapi.json'));

describe('Permissions', function () {
	it('GET /permissions', async function () {
		const res = await axios.get(`${api}/permissions?access_token=admin`);

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});

	var permission_id: number;

	it('POST /permissions', async function () {
		const res = await axios.post(`${api}/permissions?access_token=admin`, {
			"role": "2f24211d-d928-469a-aea3-3c8f53d4e426",
			"collection": "directus_settings",
			"operation": "read",
			"permissions": "{}",
			"presets": null,
			"fields": "project_name,project_logo,project_color,public_foreground,public_background,public_note",
			"limit": null
		  });

		permission_id = res.data.data.id;
	
		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});

	it('GET /permissions/{id}', async function () {
		const res = await axios.get(`${api}/permissions/${permission_id}?access_token=admin`);

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});

	it('PATCH /permissions/{id}', async function () {
		const res = await axios.patch(`${api}/permissions/${permission_id}?access_token=admin`, {
			collection: 'streets',
		});

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});

	it('DELETE /permissions/{id}', async function () {
		const res = await axios.delete(`${api}/permissions/${permission_id}?access_token=admin`);

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});

	// it('GET /permissions/me', async function() {

	//   const res = await axios.get(`${api}/permissions/me?access_token=admin`);

	//   expect(res.status).toEqual(200);
	//   expect(res).toSatisfyApiSpec();
	// });

	// it('GET /permissions/me/{collection}', async function() {

	//   const res = await axios.get(`${api}/permissions/me/mailing_list?access_token=admin`);

	//   expect(res.status).toEqual(200);
	//   expect(res).toSatisfyApiSpec();
	// });
});
