import getDatabase from '../../../database';
import logger from '../../../logger';
import { getSnapshot } from '../../../utils/get-snapshot';
import { constants as fsConstants, promises as fs } from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import { load as loadYaml } from 'js-yaml';
import { Snapshot } from '../../../types';
import { getSnapshotDiff } from '../../../utils/get-snapshot-diff';

export async function apply(snapshotPath: string, options?: { yes: boolean }): Promise<void> {
	const filename = path.resolve(process.cwd(), snapshotPath);

	const database = getDatabase();

	let snapshot: Snapshot;

	try {
		const fileContents = await fs.readFile(filename, 'utf8');

		if (filename.endsWith('.yaml') || filename.endsWith('.yml')) {
			snapshot = (await loadYaml(fileContents)) as Snapshot;
		} else {
			snapshot = JSON.parse(fileContents) as Snapshot;
		}

		const currentSnapshot = await getSnapshot({ database });

		console.log(getSnapshotDiff(currentSnapshot, snapshot));

		// await fs.writeFile('./debug.json', JSON.stringify(getSnapshotDiff(currentSnapshot, snapshot), null, 2));

		database.destroy();
		process.exit(0);
	} catch (err: any) {
		logger.error(err);
		database.destroy();
		process.exit(1);
	}
}
