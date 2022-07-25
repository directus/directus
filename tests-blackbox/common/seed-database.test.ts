import globby from 'globby';

describe('Seed Database Structure', () => {
	const paths = globby.sync('**.seed.ts', {
		cwd: `${__dirname}/../`,
	});

	if (paths.length === 0) {
		test('No seed files found', () => {
			expect(true).toBe(true);
		});
	}

	for (const path of paths) {
		const importedTest = require(`../${path}`);

		if (typeof importedTest.seedDBStructure === 'function') {
			describe(`Seeding "${path}"`, () => {
				importedTest.seedDBStructure();
			});
		}
	}
});
