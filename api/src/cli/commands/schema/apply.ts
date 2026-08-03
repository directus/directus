import chalk from 'chalk';
import { load as loadYaml } from 'js-yaml';
import getDatabase, { isInstalled, validateDatabaseConnection } from '../../../database/index.js';
import { getLicenseManager } from '../../../license/index.js';
import { useLogger } from '../../../logger/index.js';
import { isNestedMetaUpdate } from '../../../utils/schema/apply-diff.js';
import { applySnapshot } from '../../../utils/schema/apply-snapshot.js';
import { getSnapshotDiff } from '../../../utils/schema/get-snapshot-diff.js';
import { getSnapshot } from '../../../utils/schema/get-snapshot.js';

export function filterSnapshotDiff(snapshot: SnapshotDiff, filters: string[]): SnapshotDiff {
	const filterSet = new Set(filters);

	const collections = snapshot.collections.filter(({ collection }) => filterSet.has(collection));
	const fields = snapshot.fields.filter(({ collection }) => filterSet.has(collection));
	const systemFields = snapshot.systemFields.filter(({ collection }) => filterSet.has(collection));

	const relations = snapshot.relations.filter(
		({ collection, related_collection }) =>
			filterSet.has(collection) && (related_collection ? filterSet.has(related_collection) : true),
	);

	return {
		collections,
		fields,
		systemFields,
		relations,
	};
}

export function formatPath(path: string[]): string {
	return path.join('.');
}

export function formatRelatedCollection(relatedCollection: string | null): string {
	return relatedCollection ? ` -> ${relatedCollection}` : '';
}

export function formatCollectionChanges(lhs: Record<string, any>, rhs: Record<string, any>): string[] {
	const lines: string[] = [];

	for (const key of Object.keys(rhs)) {
		if (lhs[key] !== rhs[key]) {
			lines.push(`    - Set ${key} to ${rhs[key]}`);
		}
	}

	return lines;
}

export async function apply(
	snapshotPath?: string,
	options: { yes?: boolean; dryRun?: boolean; force?: boolean } = {},
): Promise<void> {
	const database = getDatabase();

	const logger = useLogger();

	try {
		await validateDatabaseConnection(database);

		if ((await isInstalled()) === false) {
			logger.error(`Database is not installed.`);
			process.exit(1);
		}

		await getLicenseManager().reloadEntitlements();

		const currentSnapshot = await getSnapshot({ database });
		let targetSnapshot: Snapshot;

		if (snapshotPath) {
			const { default: fs } = await import('fs');
			const fileContent = fs.readFileSync(snapshotPath, 'utf8');

			targetSnapshot = snapshotPath.endsWith('.yaml') || snapshotPath.endsWith('.yml')
				? (loadYaml(fileContent) as Snapshot)
				: JSON.parse(fileContent);
		} else {
			logger.error(`Snapshot path is required.`);
			process.exit(1);
		}

		let snapshotDiff = await getSnapshotDiff(currentSnapshot, targetSnapshot, { force: options.force });

		if (!snapshotDiff) {
			logger.info(`No changes to apply.`);
			return;
		}

		if (
			snapshotDiff.collections.length === 0 &&
			snapshotDiff.fields.length === 0 &&
			snapshotDiff.systemFields.length === 0 &&
			snapshotDiff.relations.length === 0
		) {
			logger.info(`No changes to apply.`);
			return;
		}

		const lines: string[] = [];

		if (snapshotDiff.collections.length > 0) {
			lines.push(`Collections:`);

			for (const { collection, diff } of snapshotDiff.collections) {
				if (diff[0]?.kind === DiffKind.EDIT || isNestedMetaUpdate(diff[0]!)) {
					lines.push(`  - ${chalk.magenta('Update')} ${collection}`);

					if (diff[0]?.kind === DiffKind.EDIT && diff[0].lhs && diff[0].rhs) {
						lines.push(...formatCollectionChanges(diff[0].lhs, diff[0].rhs));
					}
				} else if (diff[0]?.kind === DiffKind.NEW) {
					lines.push(`  - ${chalk.green('Create')} ${collection}`);
				} else if (diff[0]?.kind === DiffKind.DELETE && !isNestedMetaUpdate(diff[0]!)) {
					lines.push(`  - ${chalk.red('Delete')} ${collection}`);
				}
			}
		}

		if (snapshotDiff.fields.length > 0) {
			lines.push(`Fields:`);

			for (const { collection, field, diff } of snapshotDiff.fields) {
				if (diff[0]?.kind === DiffKind.EDIT || isNestedMetaUpdate(diff[0]!)) {
					lines.push(`  - ${chalk.magenta('Update')} ${collection}.${field}`);
				} else if (diff[0]?.kind === DiffKind.NEW) {
					lines.push(`  - ${chalk.green('Create')} ${collection}.${field}`);
				} else if (diff[0]?.kind === DiffKind.DELETE) {
					lines.push(`  - ${chalk.red('Delete')} ${collection}.${field}`);
				}
			}
		}

		if (snapshotDiff.systemFields.length > 0) {
			lines.push(`System Fields:`);

			for (const { collection, field, diff } of snapshotDiff.systemFields) {
				if (diff[0]?.kind === DiffKind.EDIT) {
					lines.push(`  - ${chalk.magenta('Update')} ${collection}.${field}`);
				} else if (diff[0]?.kind === DiffKind.NEW) {
					lines.push(`  - ${chalk.green('Create')} ${collection}.${field}`);
				} else if (diff[0]?.kind === DiffKind.DELETE) {
					lines.push(`  - ${chalk.red('Delete')} ${collection}.${field}`);
				}
			}
		}

		if (snapshotDiff.relations.length > 0) {
			lines.push(`Relations:`);

			for (const { collection, field, related_collection, diff } of snapshotDiff.relations) {
				const related = formatRelatedCollection(related_collection);

				if (diff[0]?.kind === DiffKind.EDIT) {
					lines.push(`  - ${chalk.magenta('Update')} ${collection}.${field}${related}`);
				} else if (diff[0]?.kind === DiffKind.NEW) {
					lines.push(`  - ${chalk.green('Create')} ${collection}.${field}${related}`);
				} else if (diff[0]?.kind === DiffKind.DELETE) {
					lines.push(`  - ${chalk.red('Delete')} ${collection}.${field}${related}`);
				}
			}
		}

		logger.info(`Applying the following changes:\n\n${lines.join('\n')}\n`);

		if (options.dryRun) {
			logger.info(`Dry run completed.`);
			return;
		}

		if (!options.yes) {
			const { default: inquirer } = await import('inquirer');

			const { confirm } = await inquirer.prompt([
				{
					type: 'confirm',
					name: 'confirm',
					message: 'Are you sure you want to apply these changes?',
					default: false,
				},
			]);

			if (!confirm) {
				logger.info(`Apply cancelled.`);
				return;
			}
		}

		await applySnapshot(targetSnapshot, snapshotDiff, { database });

		logger.info(`Schema apply completed successfully.`);
	} catch (error: any) {
		logger.error(`Failed to apply snapshot: ${error.message}`);
		process.exit(1);
	}
}
