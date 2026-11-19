import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { Env } from '../types/env.js';
import { validateDbEnv } from './validate-env.js';

const hostConnection = {
	DB_HOST: 'localhost',
	DB_PORT: 5432,
	DB_DATABASE: 'directus',
	DB_USER: 'user',
	DB_PASSWORD: 'secret',
};

let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
	vi.spyOn(process, 'exit').mockImplementation((() => {}) as typeof process.exit);
	consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
	vi.restoreAllMocks();
});

function expectValid(env: Record<string, unknown>) {
	validateDbEnv(env as Env);

	expect(process.exit).not.toHaveBeenCalled();
	expect(consoleError).not.toHaveBeenCalled();
}

function expectMissing(env: Record<string, unknown>, missing: string[]) {
	validateDbEnv(env as Env);

	expect(consoleError).toHaveBeenCalledWith(`"${missing.join(',')}" Environment Variable(s) is missing.`);
	expect(process.exit).toHaveBeenCalledWith(1);
}

test('Exits when DB_CLIENT is missing', () => {
	expectMissing(hostConnection, ['DB_CLIENT']);
});

test('Requires host connection variables for unknown clients', () => {
	expectValid({ DB_CLIENT: 'unknown', ...hostConnection });
	expectMissing({ DB_CLIENT: 'unknown' }, ['DB_HOST', 'DB_PORT', 'DB_DATABASE', 'DB_USER', 'DB_PASSWORD']);
});

test('Treats falsy but present values as set', () => {
	expectValid({ DB_CLIENT: 'sqlite3', DB_FILENAME: '' });
});

describe('sqlite3', () => {
	test('Passes with DB_FILENAME', () => {
		expectValid({ DB_CLIENT: 'sqlite3', DB_FILENAME: './data.db' });
	});

	test('Exits without DB_FILENAME', () => {
		expectMissing({ DB_CLIENT: 'sqlite3' }, ['DB_FILENAME']);
	});
});

describe('oracledb', () => {
	test('Passes with host connection', () => {
		expectValid({ DB_CLIENT: 'oracledb', ...hostConnection });
	});

	test('Passes with DB_CONNECT_STRING', () => {
		expectValid({ DB_CLIENT: 'oracledb', DB_USER: 'user', DB_PASSWORD: 'secret', DB_CONNECT_STRING: 'conn' });
	});

	test('Exits when credentials are missing with DB_CONNECT_STRING', () => {
		expectMissing({ DB_CLIENT: 'oracledb', DB_CONNECT_STRING: 'conn' }, ['DB_USER', 'DB_PASSWORD']);
	});

	test('Exits when host connection is incomplete', () => {
		expectMissing({ DB_CLIENT: 'oracledb', DB_HOST: 'localhost' }, [
			'DB_PORT',
			'DB_DATABASE',
			'DB_USER',
			'DB_PASSWORD',
		]);
	});
});

describe.each(['pg', 'cockroachdb'])('%s', (client) => {
	test('Passes with host connection without DB_PASSWORD', () => {
		const { DB_PASSWORD: _, ...env } = hostConnection;
		expectValid({ DB_CLIENT: client, ...env });
	});

	test('Passes with DB_CONNECTION_STRING only', () => {
		expectValid({ DB_CLIENT: client, DB_CONNECTION_STRING: 'postgres://localhost/directus' });
	});

	test('Exits when host connection is incomplete', () => {
		expectMissing({ DB_CLIENT: client, DB_HOST: 'localhost' }, ['DB_PORT', 'DB_DATABASE', 'DB_USER']);
	});
});

describe('mysql', () => {
	test('Passes with host connection', () => {
		expectValid({ DB_CLIENT: 'mysql', ...hostConnection });
	});

	test('Passes with DB_SOCKET_PATH', () => {
		expectValid({
			DB_CLIENT: 'mysql',
			DB_DATABASE: 'directus',
			DB_USER: 'user',
			DB_PASSWORD: 'secret',
			DB_SOCKET_PATH: '/tmp/mysql.sock',
		});
	});

	test('Exits when credentials are missing with DB_SOCKET_PATH', () => {
		expectMissing({ DB_CLIENT: 'mysql', DB_SOCKET_PATH: '/tmp/mysql.sock' }, ['DB_DATABASE', 'DB_USER', 'DB_PASSWORD']);
	});

	test('Exits when host connection is incomplete', () => {
		expectMissing({ DB_CLIENT: 'mysql' }, ['DB_HOST', 'DB_PORT', 'DB_DATABASE', 'DB_USER', 'DB_PASSWORD']);
	});
});

describe('mssql', () => {
	test('Passes with host connection', () => {
		expectValid({ DB_CLIENT: 'mssql', ...hostConnection });
	});

	test('Requires host connection when DB_TYPE is default', () => {
		expectValid({ DB_CLIENT: 'mssql', DB_TYPE: 'default', ...hostConnection });

		expectMissing({ DB_CLIENT: 'mssql', DB_TYPE: 'default' }, [
			'DB_HOST',
			'DB_PORT',
			'DB_DATABASE',
			'DB_USER',
			'DB_PASSWORD',
		]);
	});

	test('Requires nothing else with a non-default DB_TYPE', () => {
		expectValid({ DB_CLIENT: 'mssql', DB_TYPE: 'azure-active-directory-default' });
	});

	test('Exits when host connection is incomplete', () => {
		expectMissing({ DB_CLIENT: 'mssql', DB_HOST: 'localhost' }, ['DB_PORT', 'DB_DATABASE', 'DB_USER', 'DB_PASSWORD']);
	});
});
