import path from 'node:path';
import { ForbiddenError, InvalidPayloadError } from '@directus/errors';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { resetEnv, setEnv } from '../../../test-utils/env.js';
import { assertValidStoragePath } from './assert-valid-storage-path.js';

// Fixed cwd for the test cases, resolved so it's a real absolute path on every platform (e.g. a drive on Windows)
const cwd = path.resolve('/directus');

vi.mock('@directus/env', async () => {
	const { mockUseEnv } = await import('../../../test-utils/env.js');

	// The default CONFIG_PATH is resolved against the real cwd on import, keep it relative to the mocked cwd instead
	return mockUseEnv({ CONFIG_PATH: '.env' });
});

type TestCase = {
	name: string;
	filepath: string;
	storage?: string | undefined;
	env?: Record<string, unknown>;
	error: false | typeof ForbiddenError | typeof InvalidPayloadError;
};

function testStoragePath({ filepath, storage, env, error }: TestCase) {
	setEnv(env);

	if (error === false) {
		expect(() => assertValidStoragePath(filepath, storage)).not.toThrow();
	} else {
		expect(() => assertValidStoragePath(filepath, storage)).toThrow(error);
	}
}

describe('assertValidStoragePath', () => {
	beforeEach(() => {
		vi.spyOn(process, 'cwd').mockReturnValue(cwd);
		resetEnv();
	});

	describe('default env settings', () => {
		test.each<TestCase>([
			{
				name: 'allows a normal file under the storage root',
				filepath: '1234.jpg',
				storage: 'local',
				error: false,
			},
			{
				name: 'allows a folder literally named "extensions" inside the storage root',
				filepath: 'extensions/x.jpg',
				storage: 'local',
				error: false,
			},
			{
				name: 'defaults to the first STORAGE_LOCATIONS when storage is omitted',
				filepath: 'extensions/x.jpg',
				storage: undefined,
				error: false,
			},
			{
				name: 'rejects a storage location that does not exist',
				filepath: 'extensions/x.jpg',
				storage: 'invalid',
				error: InvalidPayloadError,
			},
		])('$name', testStoragePath);
	});

	describe('storage root is the cwd', () => {
		beforeEach(() => {
			setEnv({ STORAGE_LOCAL_ROOT: '.' });
		});

		test.each<TestCase>([
			{
				name: 'blocks writing into the extensions dir',
				filepath: 'extensions/evil.js',
				storage: 'local',
				error: ForbiddenError,
			},
			{
				name: 'blocks writing into the temp dir',
				filepath: 'node_modules/.directus/evil.js',
				storage: 'local',
				error: ForbiddenError,
			},
			{
				name: 'blocks writing into the migrations dir',
				filepath: 'migrations/20260101A-evil.js',
				storage: 'local',
				error: ForbiddenError,
			},
			{
				name: 'blocks writing into the email templates dir',
				filepath: 'templates/password-reset.liquid',
				storage: 'local',
				error: ForbiddenError,
			},
			{
				name: 'blocks overwriting the package.json',
				filepath: 'package.json',
				storage: 'local',
				error: ForbiddenError,
			},
			{
				name: 'allows a file that shares the package.json prefix',
				filepath: 'package.json.bak',
				storage: 'local',
				error: false,
			},
			{
				name: 'allows a nested package.json',
				filepath: 'uploads/package.json',
				storage: 'local',
				error: false,
			},
			{
				name: 'blocks writing into node_modules',
				filepath: 'node_modules/lodash-es/lodash.js',
				storage: 'local',
				error: ForbiddenError,
			},
			{
				name: 'allows a nested node_modules folder',
				filepath: 'uploads/node_modules/x.js',
				storage: 'local',
				error: false,
			},
			{
				name: 'blocks overwriting the config file',
				filepath: '.env',
				storage: 'local',
				error: ForbiddenError,
			},
			{
				name: 'allows a file that shares the config file prefix',
				filepath: '.env.example',
				storage: 'local',
				error: false,
			},
			{
				name: 'blocks overwriting the SQLite database',
				filepath: 'data.db',
				storage: 'local',
				env: { DB_CLIENT: 'sqlite3', DB_FILENAME: './data.db' },
				error: ForbiddenError,
			},
			{
				name: 'blocks writing the SQLite rollback journal',
				filepath: 'data.db-journal',
				storage: 'local',
				env: { DB_CLIENT: 'sqlite3', DB_FILENAME: './data.db' },
				error: ForbiddenError,
			},
			{
				name: 'blocks writing the SQLite write-ahead log',
				filepath: 'data.db-wal',
				storage: 'local',
				env: { DB_CLIENT: 'sqlite3', DB_FILENAME: './data.db' },
				error: ForbiddenError,
			},
			{
				name: 'blocks writing the SQLite shared memory file',
				filepath: 'data.db-shm',
				storage: 'local',
				env: { DB_CLIENT: 'sqlite3', DB_FILENAME: './data.db' },
				error: ForbiddenError,
			},
			{
				name: 'allows a file that shares the SQLite database prefix',
				filepath: 'data.db.bak',
				storage: 'local',
				env: { DB_CLIENT: 'sqlite3', DB_FILENAME: './data.db' },
				error: false,
			},
			{
				name: 'allows the DB_FILENAME path when the database is not SQLite',
				filepath: 'data.db',
				storage: 'local',
				env: { DB_CLIENT: 'pg', DB_FILENAME: './data.db' },
				error: false,
			},
			{
				name: 'blocks writing a file at exactly the extensions path',
				filepath: 'extensions',
				storage: 'local',
				error: ForbiddenError,
			},
			{
				name: 'does not over-block a sibling folder that shares the extensions prefix',
				filepath: 'extensions-backup/x.jpg',
				storage: 'local',
				error: false,
			},
		])('$name', testStoragePath);
	});

	describe('extensions path inside the storage root', () => {
		beforeEach(() => {
			setEnv({ STORAGE_LOCAL_ROOT: './data', EXTENSIONS_PATH: './data/extensions' });
		});

		test.each<TestCase>([
			{
				name: 'blocks writing into the extensions dir',
				filepath: 'extensions/evil.js',
				storage: 'local',
				error: ForbiddenError,
			},
			{
				name: 'allows a normal file under the storage root',
				filepath: '1234.jpg',
				storage: 'local',
				error: false,
			},
		])('$name', testStoragePath);
	});

	describe('forbidden paths that resolve to the root', () => {
		test.each<TestCase>([
			{
				name: 'blocks local writes when EXTENSIONS_PATH is the project root',
				filepath: '1234.jpg',
				storage: 'local',
				env: { EXTENSIONS_PATH: '.' },
				error: ForbiddenError,
			},
			{
				name: 'blocks local writes when EXTENSIONS_PATH is empty',
				filepath: '1234.jpg',
				storage: 'local',
				env: { EXTENSIONS_PATH: '' },
				error: ForbiddenError,
			},
			{
				name: 'blocks local writes when TEMP_PATH is the filesystem root',
				filepath: '1234.jpg',
				storage: 'local',
				env: { TEMP_PATH: '/' },
				error: ForbiddenError,
			},
		])('$name', testStoragePath);
	});

	describe('non-string env values', () => {
		// Values can be cast to other types, nothing can be loaded from those so they're skipped instead of blocking
		beforeEach(() => {
			setEnv({ STORAGE_LOCAL_ROOT: '.' });
		});

		test.each<TestCase>([
			{
				name: 'skips a null MIGRATIONS_PATH',
				filepath: 'migrations/20260101A-evil.js',
				storage: 'local',
				env: { MIGRATIONS_PATH: null },
				error: false,
			},
			{
				name: 'skips an EMAIL_TEMPLATES_PATH cast to an array',
				filepath: 'templates/password-reset.liquid',
				storage: 'local',
				env: { EMAIL_TEMPLATES_PATH: ['./templates', './more-templates'] },
				error: false,
			},
			{
				name: 'skips a SQLite DB_FILENAME cast to a number',
				filepath: '1234',
				storage: 'local',
				env: { DB_CLIENT: 'sqlite3', DB_FILENAME: 1234 },
				error: false,
			},
			{
				name: 'skips the package.json of a null PACKAGE_FILE_LOCATION',
				filepath: 'package.json',
				storage: 'local',
				env: { PACKAGE_FILE_LOCATION: null },
				error: false,
			},
			{
				name: 'still blocks the cwd node_modules with a null PACKAGE_FILE_LOCATION',
				filepath: 'node_modules/lodash-es/lodash.js',
				storage: 'local',
				env: { PACKAGE_FILE_LOCATION: null },
				error: ForbiddenError,
			},
		])('$name', testStoragePath);
	});

	describe('absolute and relative paths', () => {
		// Relative paths resolve against the cwd (/directus), like the local driver does
		test.each<TestCase>([
			{
				name: 'blocks the extensions dir when the storage root is the absolute cwd',
				filepath: 'extensions/evil.js',
				storage: 'local',
				env: { STORAGE_LOCAL_ROOT: '/directus' },
				error: ForbiddenError,
			},
			{
				name: 'blocks an absolute EXTENSIONS_PATH inside a relative storage root',
				filepath: 'extensions/evil.js',
				storage: 'local',
				env: { STORAGE_LOCAL_ROOT: './data', EXTENSIONS_PATH: '/directus/data/extensions' },
				error: ForbiddenError,
			},
			{
				name: 'blocks an absolute EXTENSIONS_PATH when the storage root is the relative cwd',
				filepath: 'extensions/evil.js',
				storage: 'local',
				env: { STORAGE_LOCAL_ROOT: '.', EXTENSIONS_PATH: '/directus/extensions' },
				error: ForbiddenError,
			},
			{
				name: 'blocks all writes when an absolute storage root is inside the extensions dir',
				filepath: '1234.jpg',
				storage: 'local',
				env: { STORAGE_LOCAL_ROOT: '/directus/extensions/uploads' },
				error: ForbiddenError,
			},
			{
				name: 'blocks all writes when a relative storage root is inside the extensions dir',
				filepath: '1234.jpg',
				storage: 'local',
				env: { STORAGE_LOCAL_ROOT: './extensions/uploads' },
				error: ForbiddenError,
			},
			{
				name: 'blocks the extensions dir when the storage root is the filesystem root',
				filepath: 'directus/extensions/evil.js',
				storage: 'local',
				env: { STORAGE_LOCAL_ROOT: '/' },
				error: ForbiddenError,
			},
			{
				name: 'blocks the extensions dir when the storage root is the parent directory',
				filepath: 'directus/extensions/evil.js',
				storage: 'local',
				env: { STORAGE_LOCAL_ROOT: '..' },
				error: ForbiddenError,
			},
			{
				name: 'blocks an EXTENSIONS_PATH with .. segments',
				filepath: 'extensions/evil.js',
				storage: 'local',
				env: { STORAGE_LOCAL_ROOT: '.', EXTENSIONS_PATH: 'uploads/../extensions' },
				error: ForbiddenError,
			},
			{
				name: 'blocks an EXTENSIONS_PATH outside the cwd inside an absolute storage root',
				filepath: 'extensions/evil.js',
				storage: 'local',
				env: { STORAGE_LOCAL_ROOT: '/tmp/repro', EXTENSIONS_PATH: '/tmp/repro/extensions' },
				error: ForbiddenError,
			},
			{
				name: 'blocks all writes when the storage root is inside TEMP_PATH',
				filepath: '1234.jpg',
				storage: 'local',
				env: { STORAGE_LOCAL_ROOT: '/directus/node_modules/.directus/uploads' },
				error: ForbiddenError,
			},
			{
				name: 'blocks traversal segments in the filename',
				filepath: 'x/../extensions/evil.js',
				storage: 'local',
				env: { STORAGE_LOCAL_ROOT: '.' },
				error: ForbiddenError,
			},
			{
				name: 'blocks dot segments in the filename',
				filepath: './extensions/./evil.js',
				storage: 'local',
				env: { STORAGE_LOCAL_ROOT: '.' },
				error: ForbiddenError,
			},
			{
				name: 'blocks backslash separators in the filename',
				filepath: 'extensions\\evil\\index.js',
				storage: 'local',
				env: { STORAGE_LOCAL_ROOT: '.' },
				error: ForbiddenError,
			},
			{
				name: 'allows an "extensions" folder in an absolute storage root outside the cwd',
				filepath: 'extensions/evil.js',
				storage: 'local',
				env: { STORAGE_LOCAL_ROOT: '/tmp/uploads' },
				error: false,
			},
			{
				name: 'allows the cwd folder name in the filename, which lands in a nested folder',
				filepath: 'directus/extensions/evil.js',
				storage: 'local',
				env: { STORAGE_LOCAL_ROOT: '' },
				error: false,
			},
		])('$name', testStoragePath);
	});

	describe('remote extension sync source', () => {
		beforeEach(() => {
			setEnv({
				STORAGE_LOCATIONS: ['local', 's3'],
				STORAGE_S3_DRIVER: 's3',
				EXTENSIONS_LOCATION: 's3',
			});
		});

		test.each<TestCase>([
			{
				name: 'blocks keys under the EXTENSIONS_PATH prefix on the sync-source bucket',
				filepath: 'extensions/evil/index.js',
				storage: 's3',
				error: ForbiddenError,
			},
			{
				name: 'blocks irrespective of STORAGE_S3_ROOT prefix',
				filepath: 'extensions/evil/index.js',
				storage: 's3',
				env: { STORAGE_S3_ROOT: 'some-prefix' },
				error: ForbiddenError,
			},
			{
				name: 'blocks every key when EXTENSIONS_PATH is the location root',
				filepath: '1234.jpg',
				storage: 's3',
				env: { EXTENSIONS_PATH: '.' },
				error: ForbiddenError,
			},
			{
				name: 'allows extension-prefixed keys on a remote location that is not the extensions location',
				filepath: 'extensions/x.js',
				storage: 's3',
				env: { EXTENSIONS_LOCATION: 'other' },
				error: false,
			},
		])('$name', testStoragePath);
	});

	describe('local extension sync source', () => {
		beforeEach(() => {
			setEnv({
				STORAGE_LOCATIONS: ['local', 'extstore'],
				STORAGE_EXTSTORE_DRIVER: 'local',
				STORAGE_EXTSTORE_ROOT: './extstore',
				EXTENSIONS_LOCATION: 'extstore',
			});
		});

		test.each<TestCase>([
			{
				name: 'blocks keys under the EXTENSIONS_PATH prefix on the sync-source location',
				filepath: 'extensions/evil/index.mjs',
				storage: 'extstore',
				error: ForbiddenError,
			},
			{
				name: 'blocks irrespective of the storage root',
				filepath: 'extensions/evil/index.mjs',
				storage: 'extstore',
				env: { STORAGE_EXTSTORE_ROOT: './some/deeply/nested/root' },
				error: ForbiddenError,
			},
			{
				// `STORAGE_EXTSTORE_*` is looked up uppercased, but the variant isn't a registered location
				name: 'rejects a case variant of the extensions location',
				filepath: 'extensions/evil/index.mjs',
				storage: 'EXTSTORE',
				error: InvalidPayloadError,
			},
			{
				// Configured location names are trimmed, the requested one isn't as the lookup is exact
				name: 'rejects a padded variant of the extensions location',
				filepath: 'extensions/evil/index.mjs',
				storage: ' extstore ',
				error: InvalidPayloadError,
			},
			{
				name: 'does not over-block a sibling folder that shares the extensions prefix',
				filepath: 'extensions-backup/x.jpg',
				storage: 'extstore',
				error: false,
			},
			{
				name: 'allows extension-prefixed keys on a local location that is not the extensions location',
				filepath: 'extensions/x.jpg',
				storage: 'local',
				error: false,
			},
			{
				name: 'blocks writes into the synced extensions copy inside TEMP_PATH',
				filepath: 'node_modules/.directus/extensions/evil/index.mjs',
				storage: 'local',
				env: { STORAGE_LOCAL_ROOT: '.' },
				error: ForbiddenError,
			},
			{
				name: 'allows an "extensions" folder in a local storage root, extensions are loaded from TEMP_PATH',
				filepath: 'extensions/x.jpg',
				storage: 'local',
				env: { STORAGE_LOCAL_ROOT: '.' },
				error: false,
			},
		])('$name', testStoragePath);
	});
});
