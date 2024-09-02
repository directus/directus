import * as http from 'http';
import { describe, expect, test } from 'vitest';
import { getAddress } from './get-address.js';
import type { ListenOptions } from 'net';
import getPort from 'get-port';
import { randomAlpha } from '@directus/random';

function createServer(listenOptions?: ListenOptions) {
	return new Promise<http.Server>((resolve, reject) => {
		const server = http.createServer();
		server.on('error', (error) => reject(error));

		if (!listenOptions) {
			return resolve(server);
		}

		server.listen(listenOptions, () => {
			resolve(server);
		});
	});
}

describe('getAddress', async () => {
	test('Should return unix socket before server is listening when path is provided', async () => {
		const serverSocket = `/tmp/server${randomAlpha(5)}.sock`;
		const server = await createServer({ path: serverSocket });

		expect(getAddress(server)).toBe(serverSocket);
		server.close();
	});

	test('Should return host + port before server is listening when path is undefined', async () => {
		const serverPort = await getPort();
		const server = await createServer({ host: '0.0.0.0', port: serverPort });

		expect(getAddress(server)).toBe(`0.0.0.0:${serverPort}`);
	});

	test('Should return unix socket when path is provided', async () => {
		const serverSocket = `/tmp/server${randomAlpha(5)}.sock`;
		const server = await createServer({ path: serverSocket });

		expect(getAddress(server)).toBe(serverSocket);
	});

	test('Should return host + port when path is undefined', async () => {
		const serverPort = await getPort();
		const server = await createServer({ host: '0.0.0.0', port: serverPort });

		expect(getAddress(server)).toBe(`0.0.0.0:${serverPort}`);
	});
});
