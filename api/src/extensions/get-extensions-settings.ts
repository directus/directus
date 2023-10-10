import type { Extension, ExtensionSettings } from '@directus/extensions';
import { difference } from 'lodash-es';
import getDatabase from '../database/index.js';

/**
 * Loads stored settings for all extensions. Creates empty new rows in extensions tables for
 * extensions that don't have settings yet, and remove any settings for extensions that are no
 * longer installed.
 */
export const getExtensionsSettings = async (extensions: Extension[]) => {
	const database = getDatabase();

	const settings = await database.select<ExtensionSettings[]>('*').from('directus_extensions');

	const extensionNames = extensions
		.map((extension) => {
			if (extension.type === 'bundle') {
				return [extension.name, ...extension.entries.map((entry) => `${extension.name}/${entry.name}`)];
			}

			return extension.name;
		})
		.flat();

	const extensionSettingNames = settings.map(({ name }) => name);

	const missing = difference(extensionNames, extensionSettingNames);

	if (missing.length > 0) {
		const missingRows = missing.map((name) => ({ name, enabled: true, options: null, permissions: null }));
		await database.insert(missingRows).into('directus_extensions');
		settings.push(...missingRows);
	}

	/**
	 * Silently ignore settings for extensions that have been manually removed from the extensions
	 * folder. Having them automatically synced feels dangerous, as it's a destructive action. In the
	 * edge case you'd deploy / start with the extensions folder misconfigured, it would remove all
	 * previous options on startup, without an option to undo.
	 */
	return settings.filter(({ name }) => extensionNames.includes(name));
};
