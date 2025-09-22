import { createDirectus, createUser, rest, staticToken } from '@directus/sdk';
import { expect, test } from 'vitest';

import { randomUUID } from 'crypto';

const api = createDirectus(`http://localhost:${process.env['PORT']}`).with(rest()).with(staticToken('admin'));

async function setupUser() {
	// Ensure the user exists
	const email = `${randomUUID()}@test.com`;

	await api.request(
		createUser({
			first_name: 'Test',
			last_name: 'User',
			email,
			password: 'secret',
		}),
	);

	return { email };
}

async function setupWS() {
	const socket = new WebSocket(`ws://localhost:${process.env['PORT']}/websocket`);

	await new Promise((resolve) => {
		socket.addEventListener('open', () => {
			resolve(true);
		});
	});

	return {
		socket,
		send: (data: any) => socket.send(JSON.stringify(data)),
		receive: (type?: string) => {
			return new Promise((resolve) => {
				socket.addEventListener('message', (event) => {
					const message = JSON.parse(event.data);

					if (!type || message.type === type) {
						resolve(message);
					}
				});
			});
		},
	};
}

test('auth with email & password', async () => {
	const { email } = await setupUser();
	const socket = await setupWS();

	socket.send({
		type: 'auth',
		email,
		password: 'secret',
	});

	const result = await socket.receive('auth');

	expect(result).toEqual({
		type: 'auth',
		status: 'ok',
		refresh_token: expect.any(String),
	});
});

test('auth with non existent email', async () => {
	const socket = await setupWS();

	socket.send({
		type: 'auth',
		email: 'non_existent@test.com',
		password: 'secret',
	});

	const result = await socket.receive('auth');

	expect(result).toEqual({
		type: 'auth',
		status: 'error',
		error: {
			code: 'AUTH_FAILED',
			message: 'Authentication handshake failed.',
		},
	});
});

test('auth with invalid email', async () => {
	const socket = await setupWS();

	socket.send({
		type: 'auth',
		email: 'invalid',
		password: 'secret',
	});

	const result = await socket.receive('auth');

	expect(result).toEqual({
		type: 'auth',
		status: 'error',
		error: {
			code: 'AUTH_FAILED',
			message: 'Authentication handshake failed.',
		},
	});
});

test('auth with invalid password', async () => {
	const { email } = await setupUser();
	const socket = await setupWS();

	socket.send({
		type: 'auth',
		email: email,
		password: 'invalid',
	});

	const result = await socket.receive('auth');

	expect(result).toEqual({
		type: 'auth',
		status: 'error',
		error: {
			code: 'AUTH_FAILED',
			message: 'Authentication handshake failed.',
		},
	});
});

test('auth with missing password', async () => {
	const { email } = await setupUser();
	const socket = await setupWS();

	socket.send({
		type: 'auth',
		email: email,
	});

	const result = await socket.receive('auth');

	expect(result).toEqual({
		type: 'auth',
		status: 'error',
		error: {
			code: 'AUTH_FAILED',
			message: 'Authentication handshake failed.',
		},
	});
});

test('auth with token', async () => {
	const socket = await setupWS();

	socket.send({
		type: 'auth',
		access_token: 'admin',
	});

	const result = await socket.receive('auth');

	expect(result).toEqual({
		type: 'auth',
		status: 'ok',
	});
});

test('auth with invalid token', async () => {
	const socket = await setupWS();

	socket.send({
		type: 'auth',
		access_token: 'invalid',
	});

	const result = await socket.receive('auth');

	expect(result).toEqual({
		type: 'auth',
		status: 'error',
		error: {
			code: 'AUTH_FAILED',
			message: 'Authentication handshake failed.',
		},
	});
});

test('auth refresh', async () => {
	const { email } = await setupUser();
	const socket = await setupWS();

	socket.send({
		type: 'auth',
		email,
		password: 'secret',
	});

	const result = await socket.receive('auth');

	socket.send({
		type: 'auth',
		refresh_token: (result as any).refresh_token,
	});

	const refreshResult = await socket.receive('auth');

	expect(refreshResult).toEqual({
		type: 'auth',
		status: 'ok',
		refresh_token: expect.any(String),
	});
});
