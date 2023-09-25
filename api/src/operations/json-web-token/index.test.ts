import jwt from 'jsonwebtoken';
import { beforeEach, expect, test, vi } from 'vitest';

import config from './index.js';

beforeEach(() => {
	vi.spyOn(jwt, 'sign');
	vi.spyOn(jwt, 'verify');
	vi.spyOn(jwt, 'decode');
});

const secret = 'some-secret';
const payload = { abc: 123 };

test('sign: should error when missing secret', async () => {
	const params = {
		operation: 'sign',
	};

	try {
		await config.handler(params, {} as any);
	} catch (err) {
		expect(err).toBeDefined();
	}

	expect(vi.mocked(jwt.sign)).not.toHaveBeenCalled();

	expect.assertions(2);
});

test('sign: should error when missing payload', async () => {
	const params = {
		operation: 'sign',
		secret,
	};

	try {
		await config.handler(params, {} as any);
	} catch (err) {
		expect(err).toBeDefined();
	}

	expect(vi.mocked(jwt.sign)).not.toHaveBeenCalled();

	expect.assertions(2);
});

test('sign: returns the JWT', async () => {
	const params = {
		operation: 'sign',
		secret,
		payload,
	};

	const result = await config.handler(params, {} as any);

	expect(vi.mocked(jwt.sign)).toHaveBeenCalledWith(params.payload, params.secret, undefined);
	expect(jwt.decode(result as string)).toMatchObject(params.payload);
});

test('sign: options can be set', async () => {
	const params = {
		operation: 'sign',
		secret,
		payload,
		options: { issuer: 'directus' },
	};

	const result = await config.handler(params, {} as any);

	expect(vi.mocked(jwt.sign)).toHaveBeenCalledWith(params.payload, params.secret, params.options);
	expect(jwt.decode(result as string)).toMatchObject({ ...params.payload, iss: params.options.issuer });
});

test('verify: should error when missing secret', async () => {
	const params = {
		operation: 'verify',
	};

	try {
		await config.handler(params, {} as any);
	} catch (err) {
		expect(err).toBeDefined();
	}

	expect(vi.mocked(jwt.verify)).not.toHaveBeenCalled();

	expect.assertions(2);
});

test('verify: should error when missing token', async () => {
	const params = {
		operation: 'verify',
		secret,
	};

	try {
		await config.handler(params, {} as any);
	} catch (err) {
		expect(err).toBeDefined();
	}

	expect(vi.mocked(jwt.verify)).not.toHaveBeenCalled();

	expect.assertions(2);
});

test('verify: should error with incorrect secret', async () => {
	const params = {
		operation: 'verify',
		secret: 'invalid-secret',
		token: jwt.sign(payload, secret),
	};

	try {
		await config.handler(params, {} as any);
	} catch (err) {
		expect(err).toBeDefined();
	}

	expect(vi.mocked(jwt.verify)).toHaveBeenCalledWith(params.token, params.secret, undefined);

	expect.assertions(2);
});

test('verify: returns the payload', async () => {
	const params = {
		operation: 'verify',
		secret,
		token: jwt.sign(payload, secret),
	};

	const result = await config.handler(params, {} as any);

	expect(vi.mocked(jwt.verify)).toHaveBeenCalledWith(params.token, params.secret, undefined);
	expect(result).toMatchObject(payload);
});

test('verify: options can be set', async () => {
	const params = {
		operation: 'verify',
		secret,
		token: jwt.sign(payload, secret),
		options: {
			complete: true,
		},
	};

	const result = await config.handler(params, {} as any);

	expect(vi.mocked(jwt.verify)).toHaveBeenCalledWith(params.token, params.secret, params.options);

	expect(result).toMatchObject({
		header: { alg: 'HS256' },
		payload,
		signature: params.token.split('.')[2],
	});
});

test('decode: should error when missing token', async () => {
	const params = {
		operation: 'decode',
	};

	try {
		await config.handler(params, {} as any);
	} catch (err) {
		expect(err).toBeDefined();
	}

	expect(vi.mocked(jwt.decode)).not.toHaveBeenCalled();

	expect.assertions(2);
});

test('decode: returns the payload', async () => {
	const params = {
		operation: 'decode',
		token: jwt.sign(payload, secret),
	};

	const result = await config.handler(params, {} as any);

	expect(vi.mocked(jwt.decode)).toHaveBeenCalledWith(params.token, undefined);
	expect(result).toMatchObject(payload);
});

test('decode: options can be set', async () => {
	const params = {
		operation: 'decode',
		token: jwt.sign(payload, secret),
		options: {
			complete: true,
		},
	};

	const result = await config.handler(params, {} as any);

	expect(vi.mocked(jwt.decode)).toHaveBeenCalledWith(params.token, params.options);

	expect(result).toMatchObject({
		header: { alg: 'HS256' },
		payload,
		signature: params.token.split('.')[2],
	});
});
