import { Command } from 'commander';
import { Extension, HookConfig } from '@directus/shared/types';
import { createCli } from './index';

jest.mock('../env', () => ({
	...jest.requireActual('../env').default,
	EXTENSIONS_PATH: '',
	SERVE_APP: false,
	DB_CLIENT: 'pg',
	DB_HOST: 'localhost',
	DB_PORT: 5432,
	DB_DATABASE: 'directus',
	DB_USER: 'postgres',
	DB_PASSWORD: 'psql1234',
}));

jest.mock('@directus/shared/utils/node/get-extensions', () => ({
	getPackageExtensions: jest.fn(() => Promise.resolve([])),
	getLocalExtensions: jest.fn(() => Promise.resolve([customCliExtension])),
}));

jest.mock(`/hooks/custom-cli/index.js`, () => customCliHook, { virtual: true });

const customCliExtension: Extension = {
	path: `/hooks/custom-cli`,
	name: 'custom-cli',
	type: 'hook',
	entrypoint: 'index.js',
	local: true,
};

const beforeHook = jest.fn();
const afterAction = jest.fn();
const afterHook = jest.fn(({ program }) => {
	(program as Command).command('custom').action(afterAction);
});

const customCliHook: HookConfig = ({ init }) => {
	init('cli.before', beforeHook);
	init('cli.after', afterHook);
};

const writeOut = jest.fn();
const writeErr = jest.fn();

const setup = async () => {
	const program = await createCli();
	program.exitOverride();
	program.configureOutput({ writeOut, writeErr });
	return program;
};

beforeEach(jest.clearAllMocks);

describe('cli hooks', () => {
	test('should call hooks before and after creating the cli', async () => {
		const program = await setup();

		expect(beforeHook).toHaveBeenCalledTimes(1);
		expect(beforeHook).toHaveBeenCalledWith({ program });

		expect(afterHook).toHaveBeenCalledTimes(1);
		expect(afterHook).toHaveBeenCalledWith({ program });
	});

	test('should be able to add a custom cli command', async () => {
		const program = await setup();
		program.parseAsync(['custom'], { from: 'user' });

		expect(afterAction).toHaveBeenCalledTimes(1);
	});
});
