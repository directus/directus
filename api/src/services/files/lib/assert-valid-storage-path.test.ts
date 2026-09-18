import { ForbiddenError } from '@directus/errors';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { assertValidStoragePath } from './assert-valid-storage-path.js';

const state = vi.hoisted(() => ({ env: {} as Record<string, unknown> }));

vi.mock('@directus/env', () => ({ useEnv: () => state.env }));

const baseEnv = (): Record<string, unknown> => ({
	STORAGE_LOCATIONS: 'local',
	STORAGE_LOCAL_DRIVER: 'local',
	STORAGE_LOCAL_ROOT: './uploads',
	EXTENSIONS_PATH: './extensions',
	TEMP_PATH: './node_modules/.directus',
});

describe('assertValidStoragePath', () => {
	beforeEach(() => {
		state.env = baseEnv();
	});

	test('allows a normal file under the storage root', () => {
		expect(() => assertValidStoragePath('1234.jpg', 'local')).not.toThrow();
	});

	test('allows a folder literally named "extensions" inside the storage root', () => {
		expect(() => assertValidStoragePath('extensions/x.jpg', 'local')).not.toThrow();
	});

	test('defaults to the first STORAGE_LOCATIONS when storage is omitted', () => {
		expect(() => assertValidStoragePath('1234.jpg')).not.toThrow();
	});

	test('blocks writing into the extensions dir when the storage root is cwd', () => {
		state.env['STORAGE_LOCAL_ROOT'] = '.';
		expect(() => assertValidStoragePath('extensions/evil.js', 'local')).toThrow(ForbiddenError);
	});

	test('blocks writing into the temp dir when the storage root is the cwd', () => {
		state.env['STORAGE_LOCAL_ROOT'] = '.';
		expect(() => assertValidStoragePath('node_modules/.directus/evil.js', 'local')).toThrow(ForbiddenError);
	});

	test('blocks when EXTENSIONS_PATH is explicitly nested under the storage root', () => {
		state.env['STORAGE_LOCAL_ROOT'] = './data';
		state.env['EXTENSIONS_PATH'] = './data/extensions';
		expect(() => assertValidStoragePath('extensions/evil.js', 'local')).toThrow(ForbiddenError);
	});

	test('does not over-block a sibling folder that shares the extensions prefix', () => {
		state.env['STORAGE_LOCAL_ROOT'] = '.';
		expect(() => assertValidStoragePath('extensions-backup/x.jpg', 'local')).not.toThrow();
	});

	test('blocks writing a file at exactly the extensions path', () => {
		state.env['STORAGE_LOCAL_ROOT'] = '.';
		expect(() => assertValidStoragePath('extensions', 'local')).toThrow(ForbiddenError);
	});

	describe('forbidden paths that resolve to the root', () => {
		test('blocks local writes when EXTENSIONS_PATH is the project root', () => {
			state.env['EXTENSIONS_PATH'] = '.';
			expect(() => assertValidStoragePath('1234.jpg', 'local')).toThrow(ForbiddenError);
		});

		test('blocks local writes when EXTENSIONS_PATH is empty', () => {
			state.env['EXTENSIONS_PATH'] = '';
			expect(() => assertValidStoragePath('1234.jpg', 'local')).toThrow(ForbiddenError);
		});

		test('blocks local writes when TEMP_PATH is the project root', () => {
			state.env['TEMP_PATH'] = '/';
			expect(() => assertValidStoragePath('1234.jpg', 'local')).toThrow(ForbiddenError);
		});

		test('blocks the extensions location when EXTENSIONS_PATH is the location root', () => {
			Object.assign(state.env, {
				STORAGE_LOCATIONS: 'local,s3',
				STORAGE_S3_DRIVER: 's3',
				EXTENSIONS_LOCATION: 's3',
				EXTENSIONS_PATH: '.',
			});

			expect(() => assertValidStoragePath('1234.jpg', 's3')).toThrow(ForbiddenError);
		});
	});

	describe('remote extension sync source', () => {
		beforeEach(() => {
			Object.assign(state.env, {
				STORAGE_LOCATIONS: 'local,s3',
				STORAGE_S3_DRIVER: 's3',
				EXTENSIONS_LOCATION: 's3',
			});
		});

		test('blocks keys under the EXTENSIONS_PATH prefix on the sync-source bucket', () => {
			expect(() => assertValidStoragePath('extensions/evil/index.js', 's3')).toThrow(ForbiddenError);
		});

		test('blocks irrespective of STORAGE_S3_ROOT prefix', () => {
			state.env['STORAGE_S3_ROOT'] = 'some-prefix';
			expect(() => assertValidStoragePath('extensions/evil/index.js', 's3')).toThrow(ForbiddenError);
		});

		test('allows extension-prefixed keys on a remote location that is not extension storage driver', () => {
			state.env['EXTENSIONS_LOCATION'] = 'other';
			expect(() => assertValidStoragePath('extensions/x.js', 's3')).not.toThrow();
		});
	});

	describe('local extension sync source', () => {
		beforeEach(() => {
			Object.assign(state.env, {
				STORAGE_LOCATIONS: 'local,extstore',
				STORAGE_EXTSTORE_DRIVER: 'local',
				STORAGE_EXTSTORE_ROOT: './extstore',
				EXTENSIONS_LOCATION: 'extstore',
			});
		});

		test('blocks keys under the EXTENSIONS_PATH prefix on the sync-source location', () => {
			expect(() => assertValidStoragePath('extensions/evil/index.mjs', 'extstore')).toThrow(ForbiddenError);
		});

		test('blocks irrespective of the storage root', () => {
			state.env['STORAGE_EXTSTORE_ROOT'] = './some/deeply/nested/root';
			expect(() => assertValidStoragePath('extensions/evil/index.mjs', 'extstore')).toThrow(ForbiddenError);
		});

		test('blocks a case variant of the extensions location', () => {
			// `STORAGE_EXTSTORE_*` is looked up uppercased, so a case variant resolves to the same config
			expect(() => assertValidStoragePath('extensions/evil/index.mjs', 'EXTSTORE')).toThrow(ForbiddenError);
		});

		test('blocks a padded variant of the extensions location', () => {
			expect(() => assertValidStoragePath('extensions/evil/index.mjs', ' extstore ')).toThrow(ForbiddenError);
		});

		test('does not over-block a sibling folder that shares the extensions prefix', () => {
			expect(() => assertValidStoragePath('extensions-backup/x.jpg', 'extstore')).not.toThrow();
		});

		test('allows extension-prefixed keys on a local location that is not the extensions location', () => {
			expect(() => assertValidStoragePath('extensions/x.jpg', 'local')).not.toThrow();
		});

		test('blocks writes into the synced extensions copy inside TEMP_PATH', () => {
			state.env['STORAGE_LOCAL_ROOT'] = '.';

			expect(() => assertValidStoragePath('node_modules/.directus/extensions/evil/index.mjs', 'local')).toThrow(
				ForbiddenError,
			);
		});

		test('allows an "extensions" folder in a local storage root, extensions are loaded from TEMP_PATH', () => {
			state.env['STORAGE_LOCAL_ROOT'] = '.';

			expect(() => assertValidStoragePath('extensions/x.jpg', 'local')).not.toThrow();
		});
	});
});
