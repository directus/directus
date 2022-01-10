/** @TODO once Oracle is officially supported, enable it here */
export const allVendors = ['mssql', 'mysql', 'postgres', /* 'oracle', */ 'maria' /*, 'sqlite3'*/, 'postgres10'];

const vendors = process.env.TEST_DB?.split(',').map((v) => v.trim()) ?? allVendors;

for (const vendor of vendors) {
	if (allVendors.includes(vendor) === false) {
		throw new Error(`No e2e testing capabilities for vendor "${vendor}".`);
	}
}

export default vendors;
