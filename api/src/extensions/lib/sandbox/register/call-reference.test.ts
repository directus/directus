import { InvalidCredentialsError, RecordNotUniqueError } from '@directus/errors';
import { FailedValidationError } from '@directus/validation';
import ivm from 'isolated-vm';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { callReference } from './call-reference.js';

vi.mock('@directus/env', () => ({
	useEnv: vi.fn(() => ({
		EXTENSIONS_SANDBOX_TIMEOUT: 1000,
	})),
}));

vi.mock('../../../../logger/index.js', () => ({
	useLogger: vi.fn(() => ({ error: vi.fn() })),
}));

let isolate: ivm.Isolate;
let context: ivm.Context;

beforeEach(() => {
	isolate = new ivm.Isolate({ memoryLimit: 8 });
	context = isolate.createContextSync();
});

afterEach(() => {
	context.release();
	isolate.dispose();
});

async function callInIsolate(code: string, args: unknown[]) {
	const fn = context.evalSync(code, { reference: true });
	const result = await callReference(fn, args);

	return result.copy();
}

test('Passes operation options containing errors from a previous operation', async () => {
	const options = { payload: [new FailedValidationError({ field: 'title', path: [], type: 'nnull' })] };

	await expect(
		callInIsolate(
			'(options) => options.payload.map((error) => ({ name: error.name, code: error.code, field: error.extensions.field }))',
			[options],
		),
	).resolves.toEqual([{ name: 'DirectusError', code: 'FAILED_VALIDATION', field: 'title' }]);
});

test('Passes an error as filter payload', async () => {
	const payload = new RecordNotUniqueError({ collection: 'articles', field: 'slug', value: 'hello' });

	await expect(
		callInIsolate('(payload) => ({ name: payload.name, code: payload.code, status: payload.status })', [payload]),
	).resolves.toEqual({ name: 'DirectusError', code: 'RECORD_NOT_UNIQUE', status: 400 });
});

test('Passes an action payload containing an error', async () => {
	const payload = { status: 'fail', error: new InvalidCredentialsError() };

	await expect(
		callInIsolate('(payload) => ({ status: payload.status, code: payload.error.code })', [payload]),
	).resolves.toEqual({ status: 'fail', code: 'INVALID_CREDENTIALS' });
});
