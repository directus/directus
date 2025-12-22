import * as http from 'http';
import { useEnv } from '@directus/env';
import { describe, expect, test, vi, afterEach } from 'vitest';
import { getAddress } from './get-address.js';
import type { ListenOptions } from 'net';
import getPort from 'get-port';

vi.mock('@directus/env');

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
	const serverHost = '127.0.0.1';
	const serverSocket = '/tmp/server-test.sock';
	const serverPort = await getPort();

	let server: http.Server | undefined;

	afterEach(async () => {
		server?.close();
		server = undefined;
	});

	test('Should return unix socket before server is listening when path is provided', async () => {
		server = await createServer();

		vi.mocked(useEnv).mockReturnValue({
			UNIX_SOCKET_PATH: serverSocket,
		});

		expect(getAddress(server)).toBe(serverSocket);
	});

	test('Should return host + port before server is listening when path is undefined', async () => {
		server = await createServer();

		vi.mocked(useEnv).mockReturnValue({
			PORT: serverPort,
			HOST: serverHost,
		});

		expect(getAddress(server)).toBe(`${serverHost}:${serverPort}`);
	});

	test('Should return unix socket when path is provided', async () => {
		server = await createServer({ path: serverSocket });

		expect(getAddress(server)).toBe(serverSocket);
	});

	test('Should return host + port when path is undefined', async () => {
		server = await createServer({ host: serverHost, port: serverPort });

		expect(getAddress(server)).toBe(`${serverHost}:${serverPort}`);
	});
});
