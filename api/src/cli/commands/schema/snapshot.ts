import getDatabase from '../../../database';
import logger from '../../../logger';
import { getSnapshot } from '../../../utils/get-snapshot';
import { constants as fsConstants, promises as fs } from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import { dump as toYaml } from 'js-yaml';
import { flushCaches } from '../../../cache';
import { sortBy } from 'lodash';
import sortDeep from 'smart-deep-sort';

export async function snapshot(
	snapshotPath: string,
	options?: { yes: boolean; format: 'json' | 'yaml' }
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

	const snapshotSorted = {
		version: snapshot.version,
		directus: snapshot.directus,
		collections: sortBy(sortDeep(snapshot.collections), ['collection']),
		fields: sortBy(sortDeep(snapshot.fields), ['collection', 'field']),
		relations: sortBy(sortDeep(snapshot.relations), ['collection', 'field']),
	};

	try {
		if (options?.format === 'yaml') {
			await fs.writeFile(filename, toYaml(snapshotSorted));
		} else {
			await fs.writeFile(filename, JSON.stringify(snapshotSorted));
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
