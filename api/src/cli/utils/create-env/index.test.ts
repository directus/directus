import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import createEnv from './index.js';

describe('createEnv', () => {
	let directory: string;

	beforeEach(async () => {
		directory = await mkdtemp(join(tmpdir(), 'create-env-'));
	});

	afterEach(async () => {
		await rm(directory, { recursive: true, force: true });
	});

	test('writes a .env file with the database credentials', async () => {
		await createEnv('pg', { host: 'localhost', port: 5432 } as any, directory);

		const content = await readFile(join(directory, '.env'), 'utf8');

		expect(content).toContain('DB_CLIENT="pg"');
		expect(content).toContain('DB_HOST="localhost"');
		expect(content).toContain('DB_PORT="5432"');
		expect(content).toMatch(/SECRET="[\w-]{32}"/);
	});

	test('maps mysql2 to the mysql client for backwards-compatibility', async () => {
		await createEnv('mysql2', {} as any, directory);

		expect(await readFile(join(directory, '.env'), 'utf8')).toContain('DB_CLIENT="mysql"');
	});

	test.skipIf(process.platform === 'win32')('restricts the .env file permissions to 0640', async () => {
		await createEnv('sqlite3', {} as any, directory);

		expect((await stat(join(directory, '.env'))).mode & 0o777).toBe(0o640);
	});
});
