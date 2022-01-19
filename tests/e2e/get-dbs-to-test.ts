export const allVendors = ['mssql', 'mysql', 'postgres', 'maria', 'oracle', 'sqlite3', 'postgres10'];

const vendors = process.env.TEST_DB?.split(',').map((v) => v.trim()) ?? allVendors;

for (const vendor of vendors) {
	if (allVendors.includes(vendor) === false) {
		throw new Error(`No e2e testing capabilities for vendor "${vendor}".`);
	}
}

export default vendors;
