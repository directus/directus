import type { Driver } from "@directus/storage";
import { readdir, readFile, writeFile } from "fs/promises";
import { Readable } from "stream";

/**
 * Copies a directory to a storage driver recursively
 * @param fsPath root path of the directory to copy
 * @param driverPath root path of the directory to copy to
 * @param driver storage driver to use
 */
export async function copyToStorageDriver(fsPath: string, driverPath: string, driver: Driver) {
	const entries = await readdir(fsPath, { withFileTypes: true });

	await Promise.all(entries.map(async (entry) => {
		const sourcePath = `${fsPath}/${entry.name}`;
		const destinationPath = `${driverPath}/${entry.name}`;

		if (entry.isDirectory()) {
			await copyToStorageDriver(sourcePath, destinationPath, driver);
		} else {
			const contents = await readFile(sourcePath);
			driver.write(destinationPath, Readable.from(contents))
		}
	}))
}

export async function copyFromStorageDriver(driverPath: string, fsPath: string, driver: Driver) {
	const entries: string[] = []

	for await (const entry of driver.list(driverPath)) {
		entries.push(entry)
	}

	await Promise.all(entries.map(async (entry) => {
		const sourcePath = `${driverPath}/${entry}`;
		const destinationPath = `${fsPath}/${entry}`;

		const readable = await driver.read(sourcePath);

		await writeFile(destinationPath, readable)
	}))
}
