import { Command } from 'commander';
import { Extension, HookConfig } from '@directus/shared/types';
import { createCli } from './index';
import { test, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/env', async () => {
	const actual = await vi.importActual('../../src/env');

	return {
		EXTENSIONS_PATH: '',
		SERVE_APP: false,
		DB_CLIENT: 'pg',
		DB_HOST: 'localhost',
		DB_PORT: 5432,
		DB_DATABASE: 'directus',
		DB_USER: 'postgres',
		DB_PASSWORD: 'psql1234',
		...actual,
	};
});

vi.mock('@directus/shared/utils/node/get-extensions', () => ({
	getPackageExtensions: vi.fn(() => Promise.resolve([])),
	getLocalExtensions: vi.fn(() => Promise.resolve([customCliExtension])),
}));

//Original call
// vi.mock(`/hooks/custom-cli/index.js`, () => customCliHook, { virtual: true });

vi.mock(`/hooks/custom-cli/index.js`, () => customCliHook);

const customCliExtension: Extension = {
	path: `/hooks/custom-cli`,
	name: 'custom-cli',
	type: 'hook',
	entrypoint: 'index.js',
	local: true,
};

const beforeHook = vi.fn();
const afterAction = vi.fn();
const afterHook = vi.fn(({ program }) => {
	(program as Command).command('custom').action(afterAction);
});

const customCliHook: HookConfig = ({ init }) => {
	init('cli.before', beforeHook);
	init('cli.after', afterHook);
};

const writeOut = vi.fn();
const writeErr = vi.fn();

const setup = async () => {
	const program = await createCli();
	program.exitOverride();
	program.configureOutput({ writeOut, writeErr });
	return program;
};

beforeEach(vi.clearAllMocks);

describe('cli hooks', () => {
	test('should call hooks before and after creating the cli', async () => {
		const program = await setup();

		expect(beforeHook).toHaveBeenCalledTimes(1);
		expect(beforeHook).toHaveBeenCalledWith({ event: 'cli.before', program });

		expect(afterHook).toHaveBeenCalledTimes(1);
		expect(afterHook).toHaveBeenCalledWith({ event: 'cli.after', program });
	});

	test('should be able to add a custom cli command', async () => {
		const program = await setup();
		program.parseAsync(['custom'], { from: 'user' });

		expect(afterAction).toHaveBeenCalledTimes(1);
	});
});
