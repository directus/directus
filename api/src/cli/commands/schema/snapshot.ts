import getDatabase from '../../../database';
import logger from '../../../logger';
import { getSnapshot } from '../../../utils/get-snapshot';
import { constants as fsConstants, promises as fs } from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import { dump as toYaml } from 'js-yaml';
import { flushCaches } from '../../../cache';

export async function snapshot(
	snapshotPath?: string,
	options?: { yes: boolean; format: 'json' | 'yaml'; merged: 'yes' | 'no' }
): Promise<void> {
	await flushCaches();

	const database = getDatabase();

	async function saveSnapshot(snapshot: any, suffix = '') {
		let snapshotString: string;

		if (options?.format === 'yaml') {
			snapshotString = toYaml(snapshot);
		} else {
			snapshotString = JSON.stringify(snapshot);
		}

		if (snapshotPath) {
			const filename = path.resolve(
				process.cwd(),
				suffix ? snapshotPath.replace(/\.(json|yaml|yml)$/, `-${suffix}.$1`) : snapshotPath
			);

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
						message: `${filename} already exists. Do you want to overwrite the file?`,
					},
				]);

				if (overwrite === false) {
					database.destroy();
					process.exit(0);
				}
			}

			await fs.writeFile(filename, snapshotString);
			logger.info(`Snapshot saved to ${filename}`);
		} else {
			process.stdout.write(snapshotString);
		}
	}

	try {
		const snapshot = await getSnapshot({ database });

		if (options?.merged === 'no') {
			const { collections, fields, relations, ...meta } = snapshot;

			const map: Record<string, any> = {};
			collections.forEach((item) => {
				map[item.collection] = item;
				map[item.collection].fields = [];
				map[item.collection].relations = [];
			});

			fields.forEach((field) => {
				const { collection, ...fieldMeta } = field;
				if (map[collection]) {
					map[collection].fields.push(fieldMeta);
				}
			});

			relations.forEach((relation) => {
				const { collection, ...relationMeta } = relation;
				if (map[collection]) {
					map[collection].relations.push(relationMeta);
				}
			});

			// Save inital snapshot file as partial
			await saveSnapshot(Object.assign({ partial: true }, meta));

			// Save all collections with fields as individual files
			for (const [collection, item] of Object.entries(map)) {
				await saveSnapshot(item, collection);
			}
		} else {
			await saveSnapshot(snapshot);
		}

		database.destroy();
		process.exit(0);
	} catch (err: any) {
		logger.error(err);
		database.destroy();
		process.exit(1);
	}
}
