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
});
