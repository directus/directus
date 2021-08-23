/** @TODO once Oracle is officially supported, enable it here */
export const allVendors = ['mssql', 'mysql', 'postgres', /* 'oracle', */ 'maria', 'sqlite3'];

export function getDBsToTest(): string[] {
	const testVendors = process.env.TEST_DB || '*';

	let vendors = [];

	if (testVendors === '*') {
		vendors = allVendors;
	} else if (testVendors.includes(',')) {
		vendors = testVendors.split(',').map((v) => v.trim());
	} else {
		vendors = [testVendors];
	}

	for (const vendor of vendors) {
		if (allVendors.includes(vendor) === false) {
			throw new Error(`No e2e testing capabilities for vendor "${vendor}".`);
		}
	}

	return vendors;
}
