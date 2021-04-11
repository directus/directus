import { getDBsToTest } from './get-dbs-to-test';
import config from './config';

export function getURLsToTest(): string[] {
	const dbVendors = getDBsToTest();
	const urls = dbVendors.map((vendor) => `http://localhost:${config.ports[vendor]!}`);
	return urls;
}
