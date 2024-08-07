import * as http from 'http';
import { describe, expect, test } from 'vitest';
import { getAddress } from './get-address.js';
import type { ListenOptions } from 'net';

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
	test('Should return undefined before server is listening', async () => {
		const server = await createServer();

		expect(getAddress(server)).toBe(undefined);
	});

	test('Should return unix socket when path is provided', async () => {
		const server = await createServer({ path: '/tmp/server.sock' });

		expect(getAddress(server)).toBe('/tmp/server.sock');
	});

	test('Should return host + port when path is undefined', async () => {
		const server = await createServer({ host: '0.0.0.0', port: 8055 });

		expect(getAddress(server)).toBe('0.0.0.0:8055');
	});
});
