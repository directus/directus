import type { Extension, ExtensionSettings } from '@directus/extensions';
import { v4 as uuid } from 'uuid';
import getDatabase from '../../database/index.js';
import { ExtensionsService } from '../../services/extensions.js';
import { getSchema } from '../../utils/get-schema.js';

/**
 * Loads stored settings for all extensions. Creates empty new rows in extensions tables for
 * extensions that don't have settings yet, and remove any settings for extensions that are no
 * longer installed.
 */
export const getExtensionsSettings = async ({
	local,
	module,
	registry,
}: {
	local: Map<string, Extension>;
	module: Map<string, Extension>;
	registry: Map<string, Extension>;
}) => {
	const database = getDatabase();

	const service = new ExtensionsService({
		knex: database,
		schema: await getSchema(),
	});

	const existingSettings = await service.extensionsItemService.readByQuery({ limit: -1 });

	const newSettings: ExtensionSettings[] = [];

	const localSettings = existingSettings.filter(({ source }) => source === 'local');
	const registrySettings = existingSettings.filter(({ source }) => source === 'registry');
	const moduleSettings = existingSettings.filter(({ source }) => source === 'module');

	const generateSettingsEntry = (folder: string, extension: Extension, source: 'local' | 'registry' | 'module') => {
		if (extension.type === 'bundle') {
			const bundleId = uuid();

			newSettings.push({
				id: bundleId,
				enabled: true,
				source: source,
				bundle: null,
				folder: folder,
			});

			for (const entry of extension.entries) {
				newSettings.push({
					id: uuid(),
					enabled: true,
					source: source,
					bundle: bundleId,
					folder: entry.name,
				});
			}
		} else {
			newSettings.push({
				id: uuid(),
				enabled: true,
				source: source,
				bundle: null,
				folder: folder,
			});
		}
	};

	for (const [folder, extension] of local.entries()) {
		const settingsExist = localSettings.some((settings) => settings.folder === folder);
		if (!settingsExist) generateSettingsEntry(folder, extension, 'local');
	}

	for (const [folder, extension] of module.entries()) {
		const settingsExist = moduleSettings.some((settings) => settings.folder === folder);
		if (!settingsExist) generateSettingsEntry(folder, extension, 'module');
	}

	for (const [folder, extension] of registry.entries()) {
		const settingsExist = registrySettings.some((settings) => settings.folder === folder);
		if (!settingsExist) generateSettingsEntry(folder, extension, 'registry');
	}

	if (newSettings.length > 0) {
		await database.insert(newSettings).into('directus_extensions');
	}

	const settings = [...existingSettings, ...newSettings];

	// /**
	//  * Silently ignore settings for extensions that have been manually removed from the extensions
	//  * folder. Having them automatically synced feels dangerous, as it's a destructive action. In the
	//  * edge case you'd deploy / start with the extensions folder misconfigured, it would remove all
	//  * previous options on startup, without an option to undo.
	//  */
	return settings.filter(({ source, folder }) => {
		switch (source) {
			case 'module':
				return Array.from(module.keys()).includes(folder);
			case 'registry':
				return Array.from(registry.keys()).includes(folder);
			case 'local':
				return Array.from(local.keys()).includes(folder);
			default:
				return false;
		}
	});
};
