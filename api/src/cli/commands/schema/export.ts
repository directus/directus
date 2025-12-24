import { promises as fs, constants as fsConstants } from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import { dump as toYaml } from 'js-yaml';
import { useLogger } from '../../../logger/index.js';
import getDatabase from '../../../database/index.js';
import { getSchema } from '../../../utils/get-schema.js';
import { getCollectionSnapshot } from '../../../utils/get-collection-snapshot.js';

export async function exportCollections(
	collections: string[],
	options?: { output?: string; format?: 'json' | 'yaml'; yes?: boolean },
): Promise<void> {
	const logger = useLogger();
	const database = getDatabase();

	try {
		const schema = await getSchema({ database, bypassCache: true });
		const outputDir = path.resolve(process.cwd(), options?.output || './schema');

		// Ensure output directory exists
		await fs.mkdir(outputDir, { recursive: true });

		// Export each collection
		for (const collectionName of collections) {
			try {
				// Fetch collection snapshot using our utility
				const snapshot = await getCollectionSnapshot(collectionName, { database, schema });

				// Determine file path
				const ext = options?.format === 'yaml' ? 'yaml' : 'json';
				const filename = `${collectionName.toLowerCase()}.${ext}`;
				const filepath = path.join(outputDir, filename);

				// Check if file exists
				let fileExists = false;

				try {
					await fs.access(filepath, fsConstants.F_OK);
					fileExists = true;
				} catch {
					// File doesn't exist
				}

				if (fileExists && !options?.yes) {
					const { overwrite } = await inquirer.prompt([
						{
							type: 'confirm',
							name: 'overwrite',
							message: `File ${filename} exists. Overwrite?`,
							default: false,
						},
					]);

					if (!overwrite) {
						logger.info(`Skipped: ${collectionName}`);
						continue;
					}
				}

				// Write file
				const content = options?.format === 'yaml' ? toYaml(snapshot) : JSON.stringify(snapshot, null, 2);

				await fs.writeFile(filepath, content, 'utf8');
				logger.info(`✓ Exported: ${collectionName} → ${filepath}`);
			} catch (error: any) {
				logger.error(`✗ Failed to export ${collectionName}: ${error.message}`);
			}
		}

		logger.info(`\nExport complete: ${collections.length} collection(s)`);

		database.destroy();
		process.exit(0);
	} catch (error: any) {
		logger.error(error);
		database.destroy();
		process.exit(1);
	}
}
