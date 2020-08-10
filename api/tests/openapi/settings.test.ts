import jestOpenAPI from 'jest-openapi';
import axios from 'axios';
import path from 'path';
import { api } from './api';

jestOpenAPI(path.join(__dirname, 'openapi.json'));

describe('Settings', function () {
	it('GET /settings', async function () {
		const res = await axios.get(`${api}/settings?access_token=admin`);

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});

	it('PATCH /settings', async function () {
		const res = await axios.patch(`${api}/settings?access_token=admin`, {
			public_note: 'This is a public note!',
		});

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});

	// it('GET /settings/{id}', async function() {

	//   const res = await axios.get(`${api}/settings/${setting_id}?access_token=admin`);

	//   expect(res.status).toEqual(200);
	//   expect(res).toSatisfyApiSpec();
	// });

	// it('PATCH /settings/{id}', async function() {

	//   const res = await axios.patch(`${api}/settings/${setting_id}?access_token=admin`, {
	//       value: 12
	//   });

	//   expect(res.status).toEqual(200);
	//   expect(res).toSatisfyApiSpec();
	// });

	// it('DELETE /settings/{id}', async function() {

	//   const res = await axios.delete(`${api}/settings/${setting_id}?access_token=admin`);

	//   expect(res.status).toEqual(200);
	//   expect(res).toSatisfyApiSpec();
	// });
});
