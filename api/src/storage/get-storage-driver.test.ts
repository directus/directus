import { beforeEach, afterEach, vi, expect, test } from 'vitest';
import { _aliasMap, getStorageDriver } from './get-storage-driver.js';
import { randWord } from '@ngneat/falso';

test('Returns imported installed driver for each supported driver', async () => {
	for (const driverKey of Object.keys(_aliasMap)) {
		const driver = await getStorageDriver(driverKey);
		expect(driver).not.toBeUndefined();
	}
});

test('Throws error for key that is not supported', async () => {
	const driverKey = `fake-${randWord()}`;

	try {
		await getStorageDriver(driverKey);
	} catch (err: any) {
		expect(err).toBeInstanceOf(Error);
		expect(err.message).toBe(`Driver "${driverKey}" doesn't exist.`);
	}
});
