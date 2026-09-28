import path from 'path';
import { isIn, isTypeIn, pathToRelativeUrl, pluralize } from '@directus/utils/node';
import { APP_EXTENSION_TYPES, HYBRID_EXTENSION_TYPES } from '../../shared/constants/index.js';
import type {
	AppExtension,
	BundleExtension,
	Extension,
	ExtensionSettings,
	HybridExtension,
} from '../../shared/types/index.js';

// A static import graph fails as a whole when one module throws, so each extension is loaded on its
// own and a failure only drops that extension.
const LOAD_HELPER = `const load = async (name, importer) => { try { return await importer(); } catch (error) { console.error('Skipped extension ' + name + ' because it threw while loading:', error); return null; } };`;

export function generateExtensionsEntrypoint(
	extensionMaps: { local: Map<string, Extension>; registry: Map<string, Extension>; module: Map<string, Extension> },
	settings: ExtensionSettings[],
): string {
	const appOrHybridExtensions: (AppExtension | HybridExtension)[] = [];
	const bundleExtensions: BundleExtension[] = [];

	for (const [source, extensions] of Object.entries(extensionMaps)) {
		for (const [folder, extension] of extensions.entries()) {
			const settingsForExtension = settings.find((setting) => setting.source === source && setting.folder === folder);

			if (!settingsForExtension) continue;

			if (isIn(extension.type, [...APP_EXTENSION_TYPES, ...HYBRID_EXTENSION_TYPES]) && settingsForExtension.enabled) {
				appOrHybridExtensions.push(extension as AppExtension | HybridExtension);
			}

			if (extension.type === 'bundle') {
				const appBundle: BundleExtension = {
					...extension,
					entries: extension.entries.filter((entry) => {
						const isApp = isIn(entry.type, [...APP_EXTENSION_TYPES, ...HYBRID_EXTENSION_TYPES]);
						if (isApp === false) return false;

						const enabled =
							settings.find(
								(setting) =>
									setting.source === source &&
									setting.folder === entry.name &&
									setting.bundle === settingsForExtension.id,
							)?.enabled ?? false;

						return enabled;
					}),
				};

				if (appBundle.entries.length > 0) {
					bundleExtensions.push(appBundle);
				}
			}
		}
	}

	const appOrHybridExtensionLoads = [...APP_EXTENSION_TYPES, ...HYBRID_EXTENSION_TYPES].flatMap((type) =>
		appOrHybridExtensions
			.filter((extension) => extension.type === type)
			.map((extension, i) => ({
				variable: `${type}${i}`,
				name: extension.name,
				url: pathToRelativeUrl(
					path.resolve(
						extension.path,
						isTypeIn(extension, HYBRID_EXTENSION_TYPES) ? extension.entrypoint.app : extension.entrypoint,
					),
				),
			})),
	);

	const bundleExtensionLoads = bundleExtensions.map((extension, i) => ({
		variable: `bundle${i}`,
		name: extension.name,
		url: pathToRelativeUrl(path.resolve(extension.path, extension.entrypoint.app)),
	}));

	const loads = [...appOrHybridExtensionLoads, ...bundleExtensionLoads];

	const extensionLoads =
		loads.length > 0
			? `${LOAD_HELPER}const [${loads.map((load) => load.variable).join(',')}] = await Promise.all([${loads
					.map((load) => `load(${JSON.stringify(load.name)}, () => import('./${load.url}'))`)
					.join(',')}]);`
			: '';

	const extensionExports = [...APP_EXTENSION_TYPES, ...HYBRID_EXTENSION_TYPES].map((type) => {
		const entries = appOrHybridExtensions
			.filter((extension) => extension.type === type)
			.map((_, i) => `${type}${i}?.default`)
			.concat(
				bundleExtensions
					.map((extension, i) =>
						extension.entries.some((entry) => entry.type === type) ? `...(bundle${i}?.${pluralize(type)} ?? [])` : null,
					)
					.filter((e): e is string => e !== null),
			);

		// a skipped extension leaves an undefined default export behind
		const filter = entries.length > 0 ? '.filter(Boolean)' : '';

		return `export const ${pluralize(type)} = [${entries.join(',')}]${filter};`;
	});

	return `${extensionLoads}${extensionExports.join('')}`;
}
