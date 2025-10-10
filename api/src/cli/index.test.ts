import { Command } from 'commander';
import { describe, expect, test, vi, beforeEach } from 'vitest';
import { createCli } from './index.js';

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
			const { loadExtensions } = await import('./load-extensions.js');
			expect(loadExtensions).toHaveBeenCalledTimes(1);
		});

		test('Should emit cli.before and cli.after events', async () => {
			const emitter = (await import('../emitter.js')).default;
			expect(emitter.emitInit).toHaveBeenCalledWith('cli.before', { program: expect.any(Command) });
			expect(emitter.emitInit).toHaveBeenCalledWith('cli.after', { program: expect.any(Command) });
		});

		test('Should allow excess arguments', () => {
			expect((program as any)._allowExcessArguments).toBe(true);
		});
	});

	describe('Command actions', () => {
		test('Should call startServer when start command is invoked', async () => {
			const { startServer } = await import('../server.js');
			vi.mocked(startServer).mockClear();

			await program.parseAsync(['node', 'directus', 'start']);

			expect(startServer).toHaveBeenCalledTimes(1);
		});

		test('Should call init when init command is invoked', async () => {
			const init = (await import('./commands/init/index.js')).default;
			vi.mocked(init).mockClear();

			await program.parseAsync(['node', 'directus', 'init']);

			expect(init).toHaveBeenCalledTimes(1);
		});

		test('Should call bootstrap when bootstrap command is invoked', async () => {
			const bootstrap = (await import('./commands/bootstrap/index.js')).default;
			vi.mocked(bootstrap).mockClear();

			await program.parseAsync(['node', 'directus', 'bootstrap']);

			expect(bootstrap).toHaveBeenCalledTimes(1);
		});

		test('Should call dbMigrate with correct arguments', async () => {
			const dbMigrate = (await import('./commands/database/migrate.js')).default;

			vi.mocked(dbMigrate).mockClear();
			await program.parseAsync(['node', 'directus', 'database', 'migrate:latest']);
			expect(dbMigrate).toHaveBeenCalledWith('latest');

			vi.mocked(dbMigrate).mockClear();
			await program.parseAsync(['node', 'directus', 'database', 'migrate:up']);
			expect(dbMigrate).toHaveBeenCalledWith('up');

			vi.mocked(dbMigrate).mockClear();
			await program.parseAsync(['node', 'directus', 'database', 'migrate:down']);
			expect(dbMigrate).toHaveBeenCalledWith('down');
		});
	});

	describe('Command options', () => {
		test('Should parse command options correctly', async () => {
			const bootstrap = (await import('./commands/bootstrap/index.js')).default;
			vi.mocked(bootstrap).mockClear();

			await program.parseAsync(['node', 'directus', 'bootstrap', '--skipAdminInit']);

			expect(bootstrap).toHaveBeenCalledWith(
				expect.objectContaining({
					skipAdminInit: true,
				}),
				expect.anything(),
			);
		});

		test('Should parse multiple options for users create command', async () => {
			const usersCreate = (await import('./commands/users/create.js')).default;
			vi.mocked(usersCreate).mockClear();

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
			const { apply } = await import('./commands/schema/apply.js');
			vi.mocked(apply).mockClear();

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
