import type { Extension, ExtensionSettings } from '@directus/types';
import { useLogger } from '../../logger/index.js';

type ExtensionSource = ExtensionSettings['source'];

export type ExtensionMaps = Record<ExtensionSource, Map<string, Extension>>;

/** When the same package is present in multiple sources, the first enabled copy in this order wins */
const SOURCE_PRECEDENCE: ExtensionSource[] = ['local', 'registry', 'module'];

/**
 * Get the extensions that should be registered: all enabled extensions, with only a single copy
 * per package name. This prevents an extension that's present in multiple sources (e.g. a local
 * extension that's also listed as a dependency) from being registered more than once.
 */
export function getEnabledExtensions(extensions: ExtensionMaps, settings: ExtensionSettings[]): ExtensionMaps {
	const logger = useLogger();

	const enabledExtensions: ExtensionMaps = { local: new Map(), registry: new Map(), module: new Map() };

	// name:"source/folder" of the copy that is registered
	const registered = new Map<string, string>();

	for (const source of SOURCE_PRECEDENCE) {
		for (const [folder, extension] of extensions[source]) {
			const enabled = settings.some(
				(setting) =>
					setting.source === source && setting.folder === folder && setting.bundle === null && setting.enabled,
			);

			if (!enabled) continue;

			const registeredCopy = registered.get(extension.name);

			if (registeredCopy) {
				logger.warn(
					`Skipping extension "${extension.name}" from ${source}/${folder}, already loaded from ${registeredCopy}`,
				);

				continue;
			}

			registered.set(extension.name, `${source}/${folder}`);
			enabledExtensions[source].set(folder, extension);
		}
	}

	return enabledExtensions;
}
