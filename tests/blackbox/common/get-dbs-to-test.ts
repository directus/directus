export const allVendors = [
	'postgres',
	'postgres-lts-16',
	'postgres-lts-15',
	'postgres-lts-14',
	'postgres-lts-13',
	'mysql',
	'mysql-lts-8',
	'maria',
	'maria-lts-10.11',
	'maria-lts-10.6',
	'mssql',
	'mssql-lts-2019',
	'oracle',
	'cockroachdb',
	'cockroachdb-lts-24.1',
	'cockroachdb-lts-23.2',
	'cockroachdb-lts-23.1',
	'sqlite3',
] as const;

export type Vendor = (typeof allVendors)[number];

const vendors = (process.env['TEST_DB']?.split(',').map((v) => v.trim()) as Vendor[]) ?? allVendors;

if (vendors.length > 1 && process.env['TEST_LOCAL']) {
	throw new Error(
		`You can't test multiple databases simultaneously when using the locally running instance of Directus.`,
	);
}

for (const vendor of vendors) {
	if (allVendors.includes(vendor) === false) {
		throw new Error(`No e2e testing capabilities for vendor "${vendor}".`);
	}
}

export default vendors;
