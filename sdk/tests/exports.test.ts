import fs from 'node:fs/promises';
import path from 'node:path';
import { assert, describe, expect, it } from 'vitest';

describe('Test Exported Types', () => {
	it('should export all schema files', async () => {
		const index = await getFileLines('src/schema/index.ts');
		const files = await getNonIndexFileNamesIn('src/schema');

		for (const file of files) {
			assert(isExportingAllFrom(file, index), `SDK schema file "${file}" is not exported`);
		}
	});

	it('should export all type files', async () => {
		const index = await getFileLines('src/types/index.ts');
		const files = await getNonIndexFileNamesIn('src/types');

		for (const file of files) {
			assert(isExportingAllFrom(file, index), `SDK type file "${file}" is not exported`);
		}
	});

	it('should export expected utils from the SDK entrypoint', async () => {
		const index = await getFileLines('src/index.ts');

		assert(
			isExportingAllFrom('utils/format-fields', index),
			'SDK util "utils/format-fields" is not exported from src/index.ts',
		);

		assert(
			isExportingAllFrom('utils/query-to-params', index),
			'SDK util "utils/query-to-params" is not exported from src/index.ts',
		);

		const mod = await import('../src/index.js');

		expect(mod.formatFields).toBeTypeOf('function');
		expect(mod.queryToParams).toBeTypeOf('function');
	});
});

const packageRoot = path.resolve(path.join(import.meta.dirname, '..'));

async function getNonIndexFileNamesIn(dir: string) {
	const files: string[] = [];

	const iterator = fs.glob('*.ts', {
		withFileTypes: true,
		cwd: path.join(packageRoot, dir),
	});

	for await (const entry of iterator) {
		if (!entry.isFile() || entry.name === 'index.ts') continue;
		files.push(entry.name.replace(/\.ts$/, ''));
	}

	return files;
}

async function getFileLines(file: string) {
	const contents = await fs.readFile(path.join(packageRoot, file), 'utf8');
	return contents.split('\n');
}

function isExportingAllFrom(file: string, lines: string[]) {
	return lines.includes(`export * from './${file}.js';`) || lines.includes(`export type * from './${file}.js';`);
}
