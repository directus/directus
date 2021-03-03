/**
 * @jest-environment node
 */

import { AxiosInstance } from 'axios';
import { AxiosTransport } from '../../../src/core/transport/axios';
import { ITransport } from '../../../src/shared/transport';
import { createTransportTests } from './tests';

//const responses = require(`./axios.responses.json`);

function createAxiosTransport(): ITransport & {
	axios: AxiosInstance & jest.Mocked<AxiosInstance>;
} {
	const transport = new AxiosTransport('http://localhost');

	const request = jest.spyOn(transport.axios, 'request');
	request.mockReturnValue(false as any);

	/*
	request.mockImplementation(async (config) => {
		const key = `${config.method?.toUpperCase()} ${config.url}`;
		if (key in responses) {
			return responses[key];
		}

		return {
			status: 404,
			data: {
				errors: [
					{
						message: `Route ${config.url} doesn't exist.`,
						extensions: {
							code: 'ROUTE_NOT_FOUND',
						},
					},
				],
			},
		};
	});*/

	return transport as any;
}

describe('axios transport', function () {
	createTransportTests(createAxiosTransport)();

	it('get should call axios get', async function () {
		const transport = createAxiosTransport();

		const response = await transport.get('test');
		expect(response.data.value).toBe(1234);
	});
});
