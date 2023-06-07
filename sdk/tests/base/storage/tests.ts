import { IStorage } from '../../../src/storage';
import { beforeEach, test, expect } from 'vitest';

export function createStorageTests(createStorage: () => IStorage) {
	return function (): void {
		beforeEach(() => {
			// These run both in node and browser mode
			if (typeof localStorage !== 'undefined') {
				localStorage.clear();
			}
		});

		test('set returns the same value', async function () {
			const storage = createStorage();

			const value = storage.set('value', '1234');
			expect(value).toBe('1234');
		});

		test('get returns previously set items', async function () {
			const storage = createStorage();

			storage.set('value1', '1234');
			const value1 = storage.get('value1');
			expect(value1).toBe('1234');

			storage.set('value2', 'string');
			const value2 = storage.get('value2');
			expect(value2).toBe('string');

			storage.set('value3', 'false');
			const value3 = storage.get('value3');
			expect(value3).toBe('false');
		});

		test('get returns null for missing items', async function () {
			const storage = createStorage();

			const value = storage.get('value');
			expect(value).toBeNull();
		});

		test('delete removes items and returns it', async function () {
			const storage = createStorage();

			let value = storage.get('abobrinha');
			expect(value).toBeNull();

			value = storage.set('value', '12345');
			expect(value).toBe('12345');

			value = storage.delete('value');
			expect(value).toBe('12345');

			value = storage.get('value');
			expect(value).toBeNull();
		});

		test('delete returns null if removing an unknown key', async function () {
			const storage = createStorage();

			const value = storage.delete('unknown');
			expect(value).toBeNull();
		});

		test('can get and set auth_token', async function () {
			const storage = createStorage();

			expect(storage.auth_token).toBeNull();

			storage.auth_token = '12345';
			expect(storage.auth_token).toBe('12345');

			storage.auth_token = null;
			expect(storage.auth_token).toBeNull();
		});

		test('can get and set auth_expires', async function () {
			const storage = createStorage();

			expect(storage.auth_expires).toBeNull();

			storage.auth_expires = 12345;
			expect(storage.auth_expires).toBe(12345);

			storage.auth_expires = null;
			expect(storage.auth_expires).toBeNull();
		});
	};
}
