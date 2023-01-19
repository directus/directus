import { Command } from 'commander';
import { Extension, HookConfig } from '@directus/shared/types';
import { createCli } from './index';
import path from 'path';
import { test, describe, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/env', async () => {
	const actual = (await vi.importActual('../../src/env')) as { default: Record<string, any> };
	const MOCK_ENV = {
		...actual.default,
		EXTENSIONS_PATH: '',
		SERVE_APP: false,
		DB_CLIENT: 'pg',
		DB_HOST: 'localhost',
		DB_PORT: 5432,
		DB_DATABASE: 'directus',
		DB_USER: 'postgres',
		DB_PASSWORD: 'psql1234',
	};
	return {
		default: MOCK_ENV,
		getEnv: () => MOCK_ENV,
	};
});

vi.mock('@directus/shared/utils/node', async () => {
	const actual = await vi.importActual('@directus/shared/utils/node');

	const customCliExtension: Extension = {
		path: '/hooks/custom-cli',
		name: 'custom-cli',
		type: 'hook',
		entrypoint: 'index.js',
		local: true,
	};

	return {
		...(actual as object),
		getPackageExtensions: vi.fn(() => Promise.resolve([])),
		getLocalExtensions: vi.fn(() => Promise.resolve([customCliExtension])),
	};
});

const beforeHook = vi.fn();
const afterAction = vi.fn();
const afterHook = vi.fn(({ program }) => {
	(program as Command).command('custom').action(afterAction);
});

const customCliHook: HookConfig = ({ init }) => {
	init('cli.before', beforeHook);
	init('cli.after', afterHook);
};

vi.mock(path.resolve('/hooks/custom-cli', 'index.js'), () => ({
	default: customCliHook,
}));

const writeOut = vi.fn();
const writeErr = vi.fn();

const setup = async () => {
	const program = await createCli();
	program.exitOverride();
	program.configureOutput({ writeOut, writeErr });
	return program;
};

beforeEach(() => {
	vi.clearAllMocks();
});

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
