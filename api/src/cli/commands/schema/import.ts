import { promises as fs } from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import { load as loadYaml } from 'js-yaml';
import { parseJSON } from '@directus/utils';
import type { CollectionSnapshot, SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { useLogger } from '../../../logger/index.js';
import getDatabase from '../../../database/index.js';
import { getSchema } from '../../../utils/get-schema.js';
import { applyCollectionAdditive } from '../../../utils/apply-collection-additive.js';
import { CollectionsService } from '../../../services/collections.js';

export async function importCollections(
	paths: string[],
	options?: { force?: boolean; skipExisting?: boolean; yes?: boolean; skipRelations?: boolean },
): Promise<void> {
	const logger = useLogger();
	const database = getDatabase();

	try {
		const schema = await getSchema({ database, bypassCache: true });

		// Resolve files to import
		const files = await resolveImportFiles(paths);

		if (files.length === 0) {
			logger.warn('No files to import');
			database.destroy();
			process.exit(0);
		}

		logger.info(`Found ${files.length} collection(s) to import:`);
		files.forEach((f) => logger.info(`  - ${path.basename(f)}`));

		// Confirm import
		if (!options?.yes) {
			const { confirm } = await inquirer.prompt([
				{
					type: 'confirm',
					name: 'confirm',
					message: 'Proceed with import?',
					default: false,
				},
			]);

			if (!confirm) {
				logger.info('Import cancelled');
				database.destroy();
				process.exit(0);
			}
		}

		// Import each collection
		const results: {
			imported: string[];
			skipped: string[];
			errors: { file: string; error: string }[];
		} = { imported: [], skipped: [], errors: [] };

		for (const filepath of files) {
			try {
				// Read and parse file
				const content = await fs.readFile(filepath, 'utf8');
				const snapshot: CollectionSnapshot =
					filepath.endsWith('.yaml') || filepath.endsWith('.yml')
						? (loadYaml(content) as CollectionSnapshot)
						: parseJSON(content);

				// Validate structure
				validateCollectionSnapshot(snapshot);

				// Check if collection exists
				const collectionsService = new CollectionsService({ knex: database, schema });
				const collections = await collectionsService.readByQuery();
				const exists = collections.some((c) => c.collection === snapshot.collection);

				if (exists && !options?.force) {
					if (options?.skipExisting) {
						results.skipped.push(snapshot.collection);
						logger.info(`⊘ Skipped (exists): ${snapshot.collection}`);
						continue;
					} else {
						throw new Error(`Collection "${snapshot.collection}" already exists. Use --force to overwrite.`);
					}
				}

				// Import collection by applying snapshot
				await importCollectionSnapshot(snapshot, database, schema, options?.skipRelations);

				results.imported.push(snapshot.collection);
				logger.info(`✓ Imported: ${snapshot.collection}`);
			} catch (error: any) {
				results.errors.push({ file: path.basename(filepath), error: error.message });
				logger.error(`✗ Failed: ${path.basename(filepath)} - ${error.message}`);
			}
		}

		// Summary
		logger.info('\n=== Import Summary ===');
		logger.info(`Imported: ${results.imported.length}`);
		logger.info(`Skipped: ${results.skipped.length}`);
		logger.info(`Errors: ${results.errors.length}`);

		const exitCode = results.errors.length > 0 ? 1 : 0;
		database.destroy();
		process.exit(exitCode);
	} catch (error: any) {
		logger.error(error);
		database.destroy();
		process.exit(1);
	}
}

// Helper: Resolve files from paths
async function resolveImportFiles(paths: string[]): Promise<string[]> {
	const files: string[] = [];

	for (const p of paths) {
		const resolvedPath = path.resolve(process.cwd(), p);
		const stat = await fs.stat(resolvedPath);

		if (stat.isDirectory()) {
			// Import all .json/.yaml files in directory
			const dirFiles = await fs.readdir(resolvedPath);
			const schemaFiles = dirFiles
				.filter(
					(f) =>
						(f.endsWith('.json') || f.endsWith('.yaml') || f.endsWith('.yml')) && f !== 'manifest.json',
				)
				.map((f) => path.join(resolvedPath, f));

			files.push(...schemaFiles);
		} else {
			files.push(resolvedPath);
		}
	}

	return files;
}

// Helper: Validate snapshot structure
function validateCollectionSnapshot(snapshot: any): void {
	if (!snapshot.collection || typeof snapshot.collection !== 'string') {
		throw new Error('Invalid schema: missing collection name');
	}

	if (!Array.isArray(snapshot.fields)) {
		throw new Error('Invalid schema: fields must be an array');
	}

	if (!Array.isArray(snapshot.relations)) {
		throw new Error('Invalid schema: relations must be an array');
	}
}

// Helper: Import collection snapshot using additive approach
async function importCollectionSnapshot(
	snapshot: CollectionSnapshot,
	database: Knex,
	schema: SchemaOverview,
	skipRelations?: boolean,
): Promise<void> {
	// Remove relations if skipRelations flag is set
	const snapshotToImport: CollectionSnapshot = skipRelations
		? { ...snapshot, relations: [] }
		: snapshot;

	// Use new additive import - only touches target collection
	await applyCollectionAdditive(snapshotToImport, {
		database,
		schema,
		merge: true, // Always merge for CLI imports
	});
}
