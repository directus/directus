/**
 * @jest-environment node
 */

import nock from 'nock';

describe('auth', function () {
	//const URL = 'http://localhost';
	nock.disableNetConnect();

	it(`auth should hit the authentication url`, async () => {
		/*
		const route = `/${method}/response`;
		(nock(URL) as any)[method](route).reply(200);

		const transport = new AxiosTransport(URL) as any;
		const response = await transport[method](route);
		expectResponse(response, {
			status: 200,
		});*/
	});
});
