import jestOpenAPI from 'jest-openapi';
import axios from 'axios';
import path from 'path';
import { api } from './api';

jestOpenAPI(path.join(__dirname, 'openapi.json'));

describe('Mail', function () {
	it('POST /mail', async function () {
		const res = await axios.post(`${api}/mail?access_token=admin`, {
			to: ['user@example.com', 'admin@example.com'],
			subject: 'New Password',
			body: 'Hello <b>{{name}}</b>, this is your new password: {{password}}.',
			type: 'html',
			data: {
				name: 'John Doe',
				password: 'secret',
			},
		});

		expect(res.status).toEqual(200);
		expect(res).toSatisfyApiSpec();
	});
});
