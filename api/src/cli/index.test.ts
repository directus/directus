import { createCli } from './index.js';
import emitter from '../emitter.js';
import { startServer } from '../server.js';
import bootstrap from './commands/bootstrap/index.js';
import dbMigrate from './commands/database/migrate.js';
import init from './commands/init/index.js';
import { apply } from './commands/schema/apply.js';
import usersCreate from './commands/users/create.js';
import { loadExtensions } from './load-extensions.js';
import { Command } from 'commander';
import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('../emitter.js', () => ({
	default: {
		emitInit: vi.fn().mockResolvedValue(undefined),
	},
}));

vi.mock('../server.js', () => ({
	startServer: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('./load-extensions.js', () => ({
	loadExtensions: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('./commands/bootstrap/index.js', () => ({
	default: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('./commands/database/migrate.js', () => ({
	default: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('./commands/init/index.js', () => ({
	default: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('./commands/schema/apply.js', () => ({
	apply: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('./commands/users/create.js', () => ({
	default: vi.fn().mockResolvedValue(undefined),
}));

describe('createCli', () => {
	let program: Command;

	beforeEach(async () => {
		vi.clearAllMocks();
		program = await createCli();
	});

	describe('CLI initialization', () => {
		test('Should create a Command instance', async () => {
			expect(program).toBeInstanceOf(Command);
		});

		test('Should load extensions during initialization', async () => {
			expect(loadExtensions).toHaveBeenCalledTimes(1);
		});

		test('Should emit cli.before and cli.after events', async () => {
			expect(emitter.emitInit).toHaveBeenCalledWith('cli.before', { program: expect.any(Command) });
			expect(emitter.emitInit).toHaveBeenCalledWith('cli.after', { program: expect.any(Command) });
		});

		test('Should allow excess arguments', async () => {
			await program.parseAsync(['node', 'directus', 'start', 'test']);

			expect(program.args).toEqual(['start', 'test']);
		});
	});

	describe('Command actions', () => {
		test('Should call startServer when start command is invoked', async () => {
			await program.parseAsync(['node', 'directus', 'start']);

			expect(startServer).toHaveBeenCalledTimes(1);
		});

		test('Should call init when init command is invoked', async () => {
			await program.parseAsync(['node', 'directus', 'init']);

			expect(init).toHaveBeenCalledTimes(1);
		});

		test('Should call bootstrap when bootstrap command is invoked', async () => {
			await program.parseAsync(['node', 'directus', 'bootstrap']);

			expect(bootstrap).toHaveBeenCalledTimes(1);
		});

		test.each([
			['latest', 'migrate:latest'],
			['up', 'migrate:up'],
			['down', 'migrate:down'],
		])('Should call dbMigrate with "%s" argument', async (expectedArg, command) => {
			await program.parseAsync(['node', 'directus', 'database', command]);

			expect(dbMigrate).toHaveBeenCalledWith(expectedArg);
		});
	});

	describe('Command options', () => {
		test('Should parse command options correctly', async () => {
			await program.parseAsync(['node', 'directus', 'bootstrap', '--skipAdminInit']);

			expect(bootstrap).toHaveBeenCalledWith(
				expect.objectContaining({
					skipAdminInit: true,
				}),
				expect.anything(),
			);
		});

		test('Should parse multiple options for users create command', async () => {
			await program.parseAsync([
				'node',
				'directus',
				'users',
				'create',
				'--email',
				'test@example.com',
				'--password',
				'test123',
				'--role',
				'admin',
			]);

			expect(usersCreate).toHaveBeenCalledWith(
				expect.objectContaining({
					email: 'test@example.com',
					password: 'test123',
					role: 'admin',
				}),
				expect.anything(),
			);
		});

		test('Should parse schema command arguments and options', async () => {
			await program.parseAsync(['node', 'directus', 'schema', 'apply', '--dry-run', './snapshot.yaml']);

			expect(apply).toHaveBeenCalledWith(
				'./snapshot.yaml',
				expect.objectContaining({
					dryRun: true,
				}),
				expect.anything(),
			);
		});
	});
});
