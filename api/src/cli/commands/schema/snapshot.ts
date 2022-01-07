import getDatabase from '../../../database';
import logger from '../../../logger';
import { getSnapshot } from '../../../utils/get-snapshot';
import { constants as fsConstants, promises as fs } from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import { dump as toYaml } from 'js-yaml';
import { flushCaches } from '../../../cache';

/**
 * Will sort the yaml keys by alphabetical order.
 * If the key is a top level key, it will be sorted by its original order.
 */
function sortYaml(snapshot: any) {
	return function sortElements(a: any, b: any) {
		if (Object.keys(snapshot).includes(a) && Object.keys(snapshot).includes(b)) {
			return 1;
		}
		return a > b ? 1 : -1;
	};
}

export async function snapshot(
	snapshotPath: string,
	options?: { yes: boolean; format: 'json' | 'yaml'; sortyaml: boolean }
): Promise<void> {
	const filename = path.resolve(process.cwd(), snapshotPath);

	let snapshotExists: boolean;

	try {
		await fs.access(filename, fsConstants.F_OK);
		snapshotExists = true;
	} catch {
		snapshotExists = false;
	}

	if (snapshotExists && options?.yes === false) {
		const { overwrite } = await inquirer.prompt([
			{
				type: 'confirm',
				name: 'overwrite',
				message: 'Snapshot already exists. Do you want to overwrite the file?',
			},
		]);

		if (overwrite === false) {
			process.exit(0);
		}
	}

	await flushCaches();

	const database = getDatabase();

	const snapshot = await getSnapshot({ database });

	try {
		if (options?.format === 'yaml') {
			if (options?.sortyaml === true) {
				await fs.writeFile(filename, toYaml(snapshot, { sortKeys: sortYaml(snapshot) }));
			} else {
				await fs.writeFile(filename, toYaml(snapshot));
			}
		} else {
			await fs.writeFile(filename, JSON.stringify(snapshot));
		}

		logger.info(`Snapshot saved to ${filename}`);

		database.destroy();
		process.exit(0);
	} catch (err: any) {
		logger.error(err);
		database.destroy();
		process.exit(1);
	}
}
