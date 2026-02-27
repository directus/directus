import { DEFAULT_REGISTRY } from '@directus/extensions-registry';
import type { SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { ExtensionsService } from '../../services/extensions.js';

/**
 * Collect installed registry extensions (id + version).
 * Only includes top-level registry extensions (not bundle children) and only
 * when the project is using the default public registry (MARKETPLACE_REGISTRY is not set).
 */
export async function collectInstalledRegistryExtensions(
	db: Knex,
	schema: SchemaOverview,
	env: Record<string, unknown>,
): Promise<Array<{ id: string; version: string }>> {
	if (env['MARKETPLACE_REGISTRY'] && typeof env['MARKETPLACE_REGISTRY'] === 'string' && env['MARKETPLACE_REGISTRY'] !== DEFAULT_REGISTRY) {
		return [];
	}

	const extensionsService = new ExtensionsService({ knex: db, schema });
	const extensions = await extensionsService.readAll();

	const results: Array<{ id: string; version: string }> = [];

	for (const ext of extensions) {
		if (ext.meta.source !== 'registry' || ext.bundle !== null || !ext.schema) continue;
		const version = 'version' in ext.schema ? ext.schema.version : undefined;
		if (!version) continue;
		results.push({ id: ext.meta.id, version });
	}

	return results;
}
