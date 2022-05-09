import globby from 'globby';

describe('Seed Database', () => {
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

		if (typeof importedTest.seedDB === 'function') {
			describe(`Seeding "${path}"`, () => {
				importedTest.seedDB();
			});
		}
	}
});
