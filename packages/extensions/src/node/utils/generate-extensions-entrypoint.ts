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

// one throwing module would fail a static import graph as a whole, so each extension loads on its own
export const LOAD_HELPER = `const load = async (name, importer) => { try { return await importer(); } catch (error) { console.error('Skipped extension ' + name + ' because it threw while loading:', error); return null; } };`;

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

	const extensionLoads = [...APP_EXTENSION_TYPES, ...HYBRID_EXTENSION_TYPES].flatMap((type) =>
		appOrHybridExtensions
			.filter((extension) => extension.type === type)
			.map((extension, i) => ({
				type,
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

	const bundleLoads = bundleExtensions.map((extension, i) => ({
		types: new Set(extension.entries.map((entry) => entry.type)),
		variable: `bundle${i}`,
		name: extension.name,
		url: pathToRelativeUrl(path.resolve(extension.path, extension.entrypoint.app)),
	}));

	const loads = [...extensionLoads, ...bundleLoads];

	const loadStatement =
		loads.length > 0
			? `${LOAD_HELPER}const [${loads.map((load) => load.variable).join(',')}] = await Promise.all([${loads
					.map((load) => `load(${JSON.stringify(load.name)}, () => import('./${load.url}'))`)
					.join(',')}]);`
			: '';

	const extensionExports = [...APP_EXTENSION_TYPES, ...HYBRID_EXTENSION_TYPES].map((type) => {
		const defaults = extensionLoads.filter((load) => load.type === type).map((load) => `${load.variable}?.default`);

		const spreads = bundleLoads
			.filter((load) => load.types.has(type))
			.map((load) => `...(${load.variable}?.${pluralize(type)} ?? [])`);

		// a skipped extension leaves an undefined default behind, a skipped bundle already spreads to nothing
		const filter = defaults.length > 0 ? '.filter(Boolean)' : '';

		return `export const ${pluralize(type)} = [${[...defaults, ...spreads].join(',')}]${filter};`;
	});

	return `${loadStatement}${extensionExports.join('')}`;
}
