import type { Extension, ExtensionSettings } from '@directus/extensions';
import { randomUUID } from 'node:crypto';
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
			const bundleId = randomUUID();

			newSettings.push({
				id: bundleId,
				enabled: true,
				source: source,
				bundle: null,
				folder: folder,
			});

			for (const entry of extension.entries) {
				newSettings.push({
					id: randomUUID(),
					enabled: true,
					source: source,
					bundle: bundleId,
					folder: entry.name,
				});
			}
		} else {
			newSettings.push({
				id: randomUUID(),
				enabled: true,
				source: source,
				bundle: null,
				folder: folder,
			});
		}
	};

	const upsertBundleEntries = (
		extension: Extension,
		existingSetting: ExtensionSettings,
		sourceSettings: ExtensionSettings[],
	) => {
		if (extension.type !== 'bundle') return;

		for (const entry of extension.entries) {
			const entrySettingsExist = sourceSettings.some((settings) => settings.folder === entry.name);

			if (!entrySettingsExist) {
				newSettings.push({
					id: randomUUID(),
					enabled: true,
					source: existingSetting.source,
					bundle: existingSetting.id,
					folder: entry.name,
				});
			}
		}
	};

	for (const [folder, extension] of local.entries()) {
		const settingsExist = localSettings.find((settings) => settings.folder === folder);

		if (settingsExist) {
			upsertBundleEntries(extension, settingsExist, localSettings);
			continue;
		}

		const settingsForName = localSettings.find((settings) => settings.folder === extension.name);

		/*
		 * TODO: Consider removing this in follow-up versions after v10.10.0
		 *
		 * Previously, the package name (from package.json) was used to identify
		 * local extensions - now it's the folder name.
		 * If those two are different, we need to check for existing settings
		 * with the package name, too. On a match and if there's no other local extension
		 * with such a folder name, these settings can be taken over with the folder updated.
		 */
		if (settingsForName && !local.has(extension.name)) {
			await service.extensionsItemService.updateOne(settingsForName.id, { folder });
			continue;
		}

		if (!settingsExist) generateSettingsEntry(folder, extension, 'local');
	}

	for (const [folder, extension] of module.entries()) {
		const settingsExist = moduleSettings.find((settings) => settings.folder === folder);

		if (settingsExist) {
			upsertBundleEntries(extension, settingsExist, moduleSettings);
		} else {
			generateSettingsEntry(folder, extension, 'module');
		}
	}

	for (const [folder, extension] of registry.entries()) {
		const settingsExist = registrySettings.find((settings) => settings.folder === folder);

		if (settingsExist) {
			upsertBundleEntries(extension, settingsExist, moduleSettings);
		} else {
			generateSettingsEntry(folder, extension, 'registry');
		}
	}

	if (newSettings.length > 0) {
		await database.insert(newSettings).into('directus_extensions');
	}

	const settings = [...existingSettings, ...newSettings];

	return settings;
};
