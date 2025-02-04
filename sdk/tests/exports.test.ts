import { glob, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import { assert, describe, test } from "vitest";

// Or enable "ESNext" in tsconfig.json#compilerOptions.lib
declare global {
	interface ArrayConstructor {
		fromAsync<T>(iterator: AsyncIterable<T>): Promise<T[]>;
	}
}

function getPackageRoot() {
	return resolve(join(import.meta.dirname, ".."));
}

async function getNonIndexFileNamesIn(dir: string) {
	const iterator = glob("*.ts", {
		withFileTypes: true,
		cwd: join(getPackageRoot(), dir),
	});

	const files = await Array.fromAsync(iterator);
	return files
		.filter((file) => file.isFile())
		.filter((file) => file.name != "index.ts")
		.map((file) => file.name.replace(/\.ts$/, ""));
}

async function getFileLines(file: string) {
	const contents = await readFile(join(getPackageRoot(), file), "utf-8");
	return contents.split("\n");
}

function isExportingAllFrom(file: string, lines: string[]) {
	return lines.includes(`export * from './${file}.js';`) ||
		lines.includes(`export type * from './${file}.js';`);
}

describe("Test Exported Types", () => {
	test("all schema files must be exported", async () => {
		const index = await getFileLines("src/schema/index.ts");
		const files = await getNonIndexFileNamesIn("src/schema");

		for (const file of files) {
			assert(
				isExportingAllFrom(file, index),
				`SDK schema file "${file}" is not exported`,
			);
		}
	});


	test("all type file must be exported", async () => {
		const index = await getFileLines("src/types/index.ts");
		const files = await getNonIndexFileNamesIn("src/types");

		for (const file of files) {
			assert(
				isExportingAllFrom(file, index),
				`SDK type file "${file}" is not exported`,
			);
		}
	});
});
