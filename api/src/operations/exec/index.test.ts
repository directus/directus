import { test, expect } from 'vitest';
import config from './index.js';

test('Rejects when Isolate uses more than allowed memory', async () => {
	const testCode = `
		const storage = [];
		const twoMegabytes = 1024 * 1024 * 2;
		while (true) {
			const array = new Uint8Array(twoMegabytes);
			for (let ii = 0; ii < twoMegabytes; ii += 4096) {
				array[ii] = 1; // we have to put something in the array to flush to real memory
			}
			storage.push(array);
		}
	`;

	await expect(
		config.handler({ code: testCode }, {
			data: {},
			env: {
				FLOWS_RUN_SCRIPT_MAX_MEMORY: 8,
				FLOWS_RUN_SCRIPT_TIMEOUT: 10000,
			},
		} as any),
	).rejects.toThrow('Array buffer allocation failed');
});

test('Rejects when operation runs for longer than allowed ', async () => {
	const testCodeSetup = `
		while (true) {}
	`;

	const testCodeOperation = `
		module.exports = async function (data) {
			while (true) {}
		}
	`;

	await expect(
		config.handler({ code: testCodeSetup }, {
			data: {},
			env: {
				FLOWS_RUN_SCRIPT_MAX_MEMORY: 8,
				FLOWS_RUN_SCRIPT_TIMEOUT: 250,
			},
		} as any),
	).rejects.toThrow('Script execution timed out.');

	await expect(
		config.handler({ code: testCodeOperation }, {
			data: {},
			env: {
				FLOWS_RUN_SCRIPT_MAX_MEMORY: 8,
				FLOWS_RUN_SCRIPT_TIMEOUT: 250,
			},
		} as any),
	).rejects.toThrow('Script execution timed out.');
});

test('Rejects when cjs modules are used', async () => {
	const testCode = `
		const test = require('node:fs');
	`;

	await expect(
		config.handler({ code: testCode }, {
			data: {},
			env: {
				FLOWS_RUN_SCRIPT_MAX_MEMORY: 8,
				FLOWS_RUN_SCRIPT_TIMEOUT: 10000,
			},
		} as any),
	).rejects.toThrow('require is not defined');
});

test('Rejects when esm modules are used', async () => {
	const testCode = `
		import { readFileSync } from 'node:fs';
	`;

	await expect(
		config.handler({ code: testCode }, {
			data: {},
			env: {
				FLOWS_RUN_SCRIPT_MAX_MEMORY: 8,
				FLOWS_RUN_SCRIPT_TIMEOUT: 10000,
			},
		} as any),
	).rejects.toThrow('Cannot use import statement outside a module [<isolated-vm>:2:3]');
});

test('Rejects when code contains syntax errors', async () => {
	const testCode = `
		~~
	`;

	await expect(
		config.handler({ code: testCode }, {
			data: {},
			env: {
				FLOWS_RUN_SCRIPT_MAX_MEMORY: 8,
				FLOWS_RUN_SCRIPT_TIMEOUT: 10000,
			},
		} as any),
	).rejects.toThrow('Unexpected end of input [<isolated-vm>:3:2]');
});

test('Rejects when code does something illegal', async () => {
	const testCode = `
		module.exports = function() {
			return a + b;
		};
	`;

	await expect(
		config.handler({ code: testCode }, {
			data: {},
			env: {
				FLOWS_RUN_SCRIPT_MAX_MEMORY: 8,
				FLOWS_RUN_SCRIPT_TIMEOUT: 10000,
			},
		} as any),
	).rejects.toThrow('a is not defined');
});

test("Rejects when code doesn't return valid function", async () => {
	const testCode = `
		module.exports = false;
	`;

	await expect(
		config.handler({ code: testCode }, {
			data: {},
			env: {
				FLOWS_RUN_SCRIPT_MAX_MEMORY: 8,
				FLOWS_RUN_SCRIPT_TIMEOUT: 10000,
			},
		} as any),
	).rejects.toThrow('module.exports is not a function');
});

test('Rejects when returned function throws', async () => {
	const testCode = `
		module.exports = function () {
			throw new Error('yup, this failed');
		};
	`;

	await expect(
		config.handler({ code: testCode }, {
			data: {},
			env: {
				FLOWS_RUN_SCRIPT_MAX_MEMORY: 8,
				FLOWS_RUN_SCRIPT_TIMEOUT: 10000,
			},
		} as any),
	).rejects.toThrow('yup, this failed');
});

test('Resolves when synchronous function is valid', async () => {
	const testCode = `
		module.exports = function (data) {
			return { result: data.greeting + ', I ran synchronously' };
		};
	`;

	await expect(
		config.handler({ code: testCode }, {
			data: { greeting: 'Hello' },
			env: {
				FLOWS_RUN_SCRIPT_MAX_MEMORY: 8,
				FLOWS_RUN_SCRIPT_TIMEOUT: 10000,
			},
		} as any),
	).resolves.toEqual({ result: 'Hello, I ran synchronously' });
});

test('Resolves when asynchronous function is valid', async () => {
	const testCode = `
		module.exports = async function (data) {
			return { result: data.greeting + ', I ran asynchronously' };
		};
	`;

	await expect(
		config.handler({ code: testCode }, {
			data: { greeting: 'Hello' },
			env: {
				FLOWS_RUN_SCRIPT_MAX_MEMORY: 8,
				FLOWS_RUN_SCRIPT_TIMEOUT: 10000,
			},
		} as any),
	).resolves.toEqual({ result: 'Hello, I ran asynchronously' });
});

test('Rejects when wrong unit is passed to max memory config', async () => {
	const testCode = `
		module.exports = async function (data) {
			return 1+1;
		};
	`;

	await expect(
		config.handler({ code: testCode }, {
			data: { greeting: 'Hello' },
			env: {
				FLOWS_RUN_SCRIPT_MAX_MEMORY: 'thisShouldFail',
				FLOWS_RUN_SCRIPT_TIMEOUT: 10000,
			},
		} as any),
	).rejects.toThrow('`memoryLimit` must be a number');
});

test('Rejects when wrong unit is passed to timeout config', async () => {
	const testCode = `
		module.exports = async function (data) {
			return 1+1;
		};
	`;

	await expect(
		config.handler({ code: testCode }, {
			data: { greeting: 'Hello' },
			env: {
				FLOWS_RUN_SCRIPT_MAX_MEMORY: 8,
				FLOWS_RUN_SCRIPT_TIMEOUT: 'thisShouldFail',
			},
		} as any),
	).rejects.toThrow('`timeout` must be a 32-bit number');
});
