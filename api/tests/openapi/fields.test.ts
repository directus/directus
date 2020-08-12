import jestOpenAPI from 'jest-openapi';
import axios from 'axios';
import path from 'path';
import { api } from './api';

jestOpenAPI(path.join(__dirname, 'openapi.json'));

const collection = 'streets';

describe('Fields', function () {
	it('GET /fields', async function () {
		const res = await axios.get(`${api}/fields?access_token=admin`);

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});

	it('GET /fields/{collection}', async function () {
		const res = await axios.get(`${api}/fields/${collection}?access_token=admin`);

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});

	var field: number;

	it('POST /fields/{collection}', async function () {
		const res = await axios.post(`${api}/fields/${collection}?access_token=admin`, {
			"field": 'test',
			"type": 'string',
			"schema": {
				"is_nullable": true,
			},
			"meta": {
				"hidden": false,
				"interface": 'text-input',
				"options": null,
				"display": null,
				"display_options": null,
				"readonly": false,
				"special": null,
			},
		});

		field = res.data.data.field;

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});

	// it('GET /fields/{collection}/{field}', async function() {

	//   const res = await axios.get(`${api}/fields/${collection}/${field}?access_token=admin`);

	//   expect(res.status).toEqual(200);
	//   expect(res).toSatisfyApiSpec();
	// });

	it('PATCH /fields/{collection}/{field}', async function () {
		const res = await axios.patch(`${api}/fields/${collection}/${field}?access_token=admin`, {
			note: 'Some note',
		});

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});

	it('DELETE /fields/{collection}/{field}', async function () {
		const res = await axios.delete(`${api}/fields/${collection}/${field}?access_token=admin`);

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});
});
