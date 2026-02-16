import { globby } from 'globby';
import { describe, expect, test } from 'vitest';
import { paths } from '../../common/config';
import { ClearCaches, DisableTestCachingSetup } from '../../common/functions';
import { sequentialTestsList } from '../../setup/sequential-tests';
import { flushRedis } from '../../utils/flush-redis';

describe('Seed Database Structure', async () => {
	DisableTestCachingSetup();

	// Clear Redis cache before seeding
	await flushRedis(6108, '127.0.0.1');

	let seeds = await globby('**.seed.ts', {
		cwd: paths.cwd,
	});

	const onlyList =
		sequentialTestsList['common'].only.length > 0 ? sequentialTestsList['common'].only : sequentialTestsList['db'].only;

	const testProject = process.env['TEST_PROJECT'];

	if (seeds.length === 0) {
		test('No seed files found', () => {
			expect(true).toBe(true);
		});
	} else if (onlyList.length > 0) {
		const requiredPaths = onlyList.map((testEntry) => {
			return testEntry.slice(1).replace('.test.ts', '.seed.ts');
		});

		seeds = seeds.filter((path) => {
			return requiredPaths.includes(path);
		});
	} else {
		if (testProject === 'common') {
			seeds = seeds.filter((path) => path.startsWith('common/') || path.startsWith('tests/common/'));
		} else if (testProject === 'db') {
			seeds = seeds.filter((path) => path.startsWith('common/') || path.startsWith('tests/db/'));
		}
	}

	for (const path of seeds) {
		const importedTest = await import(`../../${path}`);

		if (typeof importedTest.seedDBStructure === 'function') {
			describe(`Seeding "${path}"`, async () => {
				await importedTest.seedDBStructure();
			});
		}
	}

	ClearCaches();
});
