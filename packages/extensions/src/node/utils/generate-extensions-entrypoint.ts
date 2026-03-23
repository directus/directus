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

	const appOrHybridExtensionImports = [...APP_EXTENSION_TYPES, ...HYBRID_EXTENSION_TYPES].flatMap((type) =>
		appOrHybridExtensions
			.filter((extension) => extension.type === type)
			.map(
				(extension, i) =>
					`import ${type}${i} from './${pathToRelativeUrl(
						path.resolve(
							extension.path,
							isTypeIn(extension, HYBRID_EXTENSION_TYPES) ? extension.entrypoint.app : extension.entrypoint,
						),
					)}';`,
			),
	);

	const bundleExtensionImports = bundleExtensions.map((extension, i) =>
		extension.entries.length > 0
			? `import {${[...APP_EXTENSION_TYPES, ...HYBRID_EXTENSION_TYPES]
					.filter((type) => extension.entries.some((entry) => entry.type === type))
					.map((type) => `${pluralize(type)} as ${type}Bundle${i}`)
					.join(',')}} from './${pathToRelativeUrl(path.resolve(extension.path, extension.entrypoint.app))}';`
			: '',
	);

	const extensionExports = [...APP_EXTENSION_TYPES, ...HYBRID_EXTENSION_TYPES].map(
		(type) =>
			`export const ${pluralize(type)} = [${appOrHybridExtensions
				.filter((extension) => extension.type === type)
				.map((_, i) => `${type}${i}`)
				.concat(
					bundleExtensions
						.map((extension, i) =>
							extension.entries.some((entry) => entry.type === type) ? `...${type}Bundle${i}` : null,
						)
						.filter((e): e is string => e !== null),
				)
				.join(',')}];`,
	);

	return `${appOrHybridExtensionImports.join('')}${bundleExtensionImports.join('')}${extensionExports.join('')}`;
}
