import getDatabase from '../../../database';
import logger from '../../../logger';
import { getSnapshot } from '../../../utils/get-snapshot';
import { constants as fsConstants, promises as fs } from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import { dump as toYaml } from 'js-yaml';
import { flushCaches } from '../../../cache';

export async function snapshot(
	snapshotPath: string,
	options?: { yes: boolean; format: 'json' | 'yaml' }
): Promise<void> {
	let filename: any;
	if (snapshotPath) {
		filename = path.resolve(process.cwd(), snapshotPath);

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
	} else filename = process.stdout;

	await flushCaches();

	const database = getDatabase();

	const snapshot = await getSnapshot({ database });

	try {
		if (options?.format === 'yaml') {
			if (snapshotPath) await fs.writeFile(filename, toYaml(snapshot));
			else process.stdout.write(toYaml(snapshot));
		} else {
			if (snapshotPath) await fs.writeFile(filename, JSON.stringify(snapshot));
			else process.stdout.write(JSON.stringify(snapshot));
		}

		if (snapshotPath) logger.info(`Snapshot saved to ${filename}`);

		database.destroy();
		process.exit(0);
	} catch (err: any) {
		logger.error(err);
		database.destroy();
		process.exit(1);
	}
}
