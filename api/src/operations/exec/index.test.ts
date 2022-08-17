import config from './index';

test('Rejects when modules are used without modules being allowed', async () => {
	const testCode = `
		const test = require('test');
	`;

	expect(
		config.handler({ code: testCode }, {
			data: {},
			env: {
				FLOWS_EXEC_ALLOWED_MODULES: '',
			},
		} as any)
	).rejects.toEqual(new Error("Couldn't run code: Cannot find module 'test'"));
});

test('Rejects when code contains syntax errors', () => {
	const testCode = `
		~~
	`;

	expect(
		config.handler({ code: testCode }, {
			data: {},
			env: {
				FLOWS_EXEC_ALLOWED_MODULES: '',
			},
		} as any)
	).rejects.toEqual(new Error("Couldn't compile code: Unexpected end of input"));
});

test('Rejects when returned function does something illegal', () => {
	const testCode = `
		module.exports = function() {
			return a + b;
		};
	`;

	expect(
		config.handler({ code: testCode }, {
			data: {},
			env: {
				FLOWS_EXEC_ALLOWED_MODULES: '',
			},
		} as any)
	).rejects.toEqual(new Error("Couldn't run code: a is not defined"));
});

test("Rejects when code doesn't return valid function", () => {
	const testCode = `
		module.exports = false;
	`;

	expect(
		config.handler({ code: testCode }, {
			data: {},
			env: {
				FLOWS_EXEC_ALLOWED_MODULES: '',
			},
		} as any)
	).rejects.toEqual(new Error("Couldn't run code: fn is not a function"));
});

test('Rejects returned function throws errors', () => {
	const testCode = `
		module.exports = function () {
			throw new Error('test');
		};
	`;

	expect(
		config.handler({ code: testCode }, {
			data: {},
			env: {
				FLOWS_EXEC_ALLOWED_MODULES: '',
			},
		} as any)
	).rejects.toEqual(new Error("Couldn't run code: test"));
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
			env: {
				FLOWS_EXEC_ALLOWED_MODULES: 'bytes',
			},
		} as any)
	).resolves.toEqual({ result: '1000B' });
});
