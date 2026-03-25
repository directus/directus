import { randWord } from '@ngneat/falso';
import { expect, test, vi } from 'vitest';
import { _aliasMap, getStorageDriver } from './get-storage-driver.js';

test('Returns imported installed driver for each supported driver', async () => {
	for (const [driverKey, driverPkg] of Object.entries(_aliasMap)) {
		vi.doMock(driverPkg, () => ({ default: driverPkg }));

		const driver = await getStorageDriver(driverKey);

		expect(driver).toBe(driverPkg);
	}
});

test('Throws error for key that is not supported', async () => {
	const driverKey = `fake-${randWord()}`;

	await expect(() => getStorageDriver(driverKey)).rejects.toThrowError(`Driver "${driverKey}" doesn't exist.`);
});
