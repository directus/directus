import { parseJSON } from '@directus/utils';
import chalk from 'chalk';
import { promises as fs } from 'fs';
import inquirer from 'inquirer';
import { load as loadYaml } from 'js-yaml';
import path from 'path';
import getDatabase, { isInstalled, validateDatabaseConnection } from '../../../database/index.js';
import logger from '../../../logger.js';
import type { Snapshot } from '../../../types/index.js';
import { DiffKind } from '../../../types/index.js';
import { isNestedMetaUpdate } from '../../../utils/apply-diff.js';
import { applySnapshot } from '../../../utils/apply-snapshot.js';
import { getSnapshotDiff } from '../../../utils/get-snapshot-diff.js';
import { getSnapshot } from '../../../utils/get-snapshot.js';

export async function apply(snapshotPath: string, options?: { yes: boolean; dryRun: boolean }): Promise<void> {
	const filename = path.resolve(process.cwd(), snapshotPath);

	const database = getDatabase();

	await validateDatabaseConnection(database);

	if ((await isInstalled()) === false) {
		logger.error(`Directus isn't installed on this database. Please run "directus bootstrap" first.`);
		database.destroy();
		process.exit(0);
	}

	let snapshot: Snapshot;

	try {
		const fileContents = await fs.readFile(filename, 'utf8');

		if (filename.endsWith('.yaml') || filename.endsWith('.yml')) {
			snapshot = (await loadYaml(fileContents)) as Snapshot;
		} else {
			snapshot = parseJSON(fileContents) as Snapshot;
		}

		const currentSnapshot = await getSnapshot({ database });
		const snapshotDiff = getSnapshotDiff(currentSnapshot, snapshot);

		if (
			snapshotDiff.collections.length === 0 &&
			snapshotDiff.fields.length === 0 &&
			snapshotDiff.relations.length === 0
		) {
			logger.info('No changes to apply.');
			database.destroy();
			process.exit(0);
		}

		const dryRun = options?.dryRun === true;
		const promptForChanges = !dryRun && options?.yes !== true;

		if (dryRun || promptForChanges) {
			let message = '';

			if (snapshotDiff.collections.length > 0) {
				message += chalk.black.underline.bold('Collections:');

				for (const { collection, diff } of snapshotDiff.collections) {
					if (diff[0]?.kind === DiffKind.EDIT) {
						message += `\n  - ${chalk.blue('Update')} ${collection}`;

						for (const change of diff) {
							if (change.kind === DiffKind.EDIT) {
								const path = change.path!.slice(1).join('.');
								message += `\n    - Set ${path} to ${change.rhs}`;
							}
						}
					} else if (diff[0]?.kind === DiffKind.DELETE) {
						message += `\n  - ${chalk.red('Delete')} ${collection}`;
					} else if (diff[0]?.kind === DiffKind.NEW) {
						message += `\n  - ${chalk.green('Create')} ${collection}`;
					} else if (diff[0]?.kind === DiffKind.ARRAY) {
						message += `\n  - ${chalk.blue('Update')} ${collection}`;
					}
				}
			}

			if (snapshotDiff.fields.length > 0) {
				message += '\n\n' + chalk.black.underline.bold('Fields:');

				for (const { collection, field, diff } of snapshotDiff.fields) {
					if (diff[0]?.kind === DiffKind.EDIT || isNestedMetaUpdate(diff[0]!)) {
						message += `\n  - ${chalk.blue('Update')} ${collection}.${field}`;

						for (const change of diff) {
							const path = change.path!.slice(1).join('.');

							if (change.kind === DiffKind.EDIT) {
								message += `\n    - Set ${path} to ${change.rhs}`;
							} else if (change.kind === DiffKind.DELETE) {
								message += `\n    - Remove ${path}`;
							} else if (change.kind === DiffKind.NEW) {
								message += `\n    - Add ${path} and set it to ${change.rhs}`;
							}
						}
					} else if (diff[0]?.kind === DiffKind.DELETE) {
						message += `\n  - ${chalk.red('Delete')} ${collection}.${field}`;
					} else if (diff[0]?.kind === DiffKind.NEW) {
						message += `\n  - ${chalk.green('Create')} ${collection}.${field}`;
					} else if (diff[0]?.kind === DiffKind.ARRAY) {
						message += `\n  - ${chalk.blue('Update')} ${collection}.${field}`;
					}
				}
			}

			if (snapshotDiff.relations.length > 0) {
				message += '\n\n' + chalk.black.underline.bold('Relations:');

				for (const { collection, field, related_collection, diff } of snapshotDiff.relations) {
					if (diff[0]?.kind === DiffKind.EDIT) {
						message += `\n  - ${chalk.blue('Update')} ${collection}.${field}`;

						for (const change of diff) {
							if (change.kind === DiffKind.EDIT) {
								const path = change.path!.slice(1).join('.');
								message += `\n    - Set ${path} to ${change.rhs}`;
							}
						}
					} else if (diff[0]?.kind === DiffKind.DELETE) {
						message += `\n  - ${chalk.red('Delete')} ${collection}.${field}`;
					} else if (diff[0]?.kind === DiffKind.NEW) {
						message += `\n  - ${chalk.green('Create')} ${collection}.${field}`;
					} else if (diff[0]?.kind === DiffKind.ARRAY) {
						message += `\n  - ${chalk.blue('Update')} ${collection}.${field}`;
					} else {
						continue;
					}

					// Related collection doesn't exist for a2o relationship types
					if (related_collection) {
						message += `-> ${related_collection}`;
					}
				}
			}

			message = 'The following changes will be applied:\n\n' + chalk.black(message);

			if (dryRun) {
				logger.info(message);
				process.exit(0);
			}

			const { proceed } = await inquirer.prompt([
				{
					type: 'confirm',
					name: 'proceed',
					message: message + '\n\n' + 'Would you like to continue?',
				},
			]);

			if (proceed === false) {
				process.exit(0);
			}
		}

		await applySnapshot(snapshot, { current: currentSnapshot, diff: snapshotDiff, database });

		logger.info(`Snapshot applied successfully`);

		database.destroy();
		process.exit(0);
	} catch (err: any) {
		logger.error(err);
		database.destroy();
		process.exit(1);
	}
}
