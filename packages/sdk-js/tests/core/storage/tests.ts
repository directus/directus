import { IStorage } from '../../../src/shared/storage';

export function createStorageTests(createStorage: () => IStorage) {
	return function () {
		it('set returns the same value', async function () {
			const storage = createStorage();

			const value1 = await storage.set('value1', 1234);
			expect(value1).toBe(1234);

			const value2 = await storage.set('value2', 'string');
			expect(value2).toBe('string');

			const value3 = await storage.set('value3', true);
			expect(value3).toBe(true);
		});

		it('get returns previously set items', async function () {
			const storage = createStorage();

			await storage.set('value1', 1234);
			const value1 = await storage.get('value1');
			expect(value1).toBe(1234);

			await storage.set('value2', 'string');
			const value2 = await storage.get('value2');
			expect(value2).toBe('string');

			await storage.set('value3', false);
			const value3 = await storage.get('value3');
			expect(value3).toBe(false);
		});

		it('get returns undefined for missing items', async function () {
			const storage = createStorage();

			const value = await storage.get('value');
			expect(value).toBeUndefined();
		});

		it('delete removes items and returns it', async function () {
			const storage = createStorage();

			let value = await storage.get('value');
			expect(value).toBeUndefined();

			value = await storage.set('value', 12345);
			expect(value).toBe(12345);

			value = await storage.delete('value');
			expect(value).toBe(12345);

			value = await storage.get('value');
			expect(value).toBeUndefined();
		});

		it('delete returns undefined if removing an unknown key', async function () {
			const storage = createStorage();

			const value = await storage.delete('value');
			expect(value).toBeUndefined();
		});
	};
}
