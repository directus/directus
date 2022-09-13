import globby from 'globby';
import * as common from '@common/index';
import { list } from '../setup/sequentialTests';

describe('Seed Database Structure', () => {
	common.DisableTestCachingSetup();

	let paths = globby.sync('**.seed.ts', {
		cwd: `${__dirname}/../`,
	});

	if (paths.length === 0) {
		test('No seed files found', () => {
			expect(true).toBe(true);
		});
	} else if (list.only.length > 0) {
		const requiredPaths = list.only.map((testEntry) => {
			return testEntry.testFilePath.slice(1).replace('.test.ts', '.seed.ts');
		});

		paths = paths.filter((path) => {
			return requiredPaths.includes(path);
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

	common.ClearCaches();
});
