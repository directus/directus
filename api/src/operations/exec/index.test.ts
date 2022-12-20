import { VMError } from 'vm2';
import { test, expect } from 'vitest';

import config from './index';

test('Rejects when modules are used without modules being allowed', async () => {
	const testCode = `
		const test = require('test');
	`;

	await expect(
		config.handler({ code: testCode }, {
			data: {},
			env: {
				FLOWS_EXEC_ALLOWED_MODULES: '',
			},
		} as any)
	).rejects.toEqual(new VMError("Cannot find module 'test'"));
});

test('Rejects when code contains syntax errors', async () => {
	const testCode = `
		~~
	`;

	await expect(
		config.handler({ code: testCode }, {
			data: {},
			env: {
				FLOWS_EXEC_ALLOWED_MODULES: '',
			},
		} as any)
	).rejects.toEqual(new SyntaxError('Unexpected end of input'));
});

test('Rejects when returned function does something illegal', async () => {
	const testCode = `
		module.exports = function() {
			return a + b;
		};
	`;

	await expect(
		config.handler({ code: testCode }, {
			data: {},
			env: {
				FLOWS_EXEC_ALLOWED_MODULES: '',
			},
		} as any)
	).rejects.toEqual(new ReferenceError('a is not defined'));
});

test("Rejects when code doesn't return valid function", async () => {
	const testCode = `
		module.exports = false;
	`;

	await expect(
		config.handler({ code: testCode }, {
			data: {},
			env: {
				FLOWS_EXEC_ALLOWED_MODULES: '',
			},
		} as any)
	).rejects.toEqual(new TypeError('fn is not a function'));
});

test('Rejects returned function throws errors', async () => {
	const testCode = `
		module.exports = function () {
			throw new Error('test');
		};
	`;

	await expect(
		config.handler({ code: testCode }, {
			data: {},
			env: {
				FLOWS_EXEC_ALLOWED_MODULES: '',
			},
		} as any)
	).rejects.toEqual(new Error('test'));
});

test('Executes function when valid', () => {
	const testCode = `
		module.exports = function (data) {
			return { result: data.input + ' test' };
		};
	`;

	expect(
		config.handler({ code: testCode }, {
			data: {
				input: 'start',
			},
			env: {
				FLOWS_EXEC_ALLOWED_MODULES: '',
			},
		} as any)
	).resolves.toEqual({ result: 'start test' });
});

test('Allows modules that are whitelisted', () => {
	const testCode = `
		const bytes = require('bytes');

		module.exports = function (data) {
			return { result: bytes(1000) };
		};
	`;

	expect(
		config.handler({ code: testCode }, {
			data: {},
			env: {
				FLOWS_EXEC_ALLOWED_MODULES: 'bytes',
			},
		} as any)
	).resolves.toEqual({ result: '1000B' });
});
