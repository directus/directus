import { APP_EXTENSION_TYPES, HYBRID_EXTENSION_TYPES } from '../../shared/constants/index.js';
import { isIn, isTypeIn, pathToRelativeUrl, pluralize } from '@directus/utils/node';
import path from 'path';
import type {
	AppExtension,
	BundleExtension,
	Extension,
	ExtensionSettings,
	HybridExtension,
} from '../../shared/types/index.js';

export function generateExtensionsEntrypoint(extensions: Extension[], settings: ExtensionSettings[]): string {
	const appOrHybridExtensions = extensions.filter((extension): extension is AppExtension | HybridExtension => {
		if (!isIn(extension.type, [...APP_EXTENSION_TYPES, ...HYBRID_EXTENSION_TYPES])) return false;
		const { enabled } = settings.find(({ name }) => name === extension.name) ?? { enabled: false };
		return enabled;
	});

	const bundleExtensions = extensions
		.filter(
			(extension): extension is BundleExtension =>
				extension.type === 'bundle' &&
				extension.entries.some((entry) => isIn(entry.type, [...APP_EXTENSION_TYPES, ...HYBRID_EXTENSION_TYPES])),
		)
		.map((bundle) => ({
			...bundle,
			entries: bundle.entries.filter(({ name }) => {
				const entryName = `${bundle.name}/${name}`;
				const { enabled } = settings.find(({ name }) => name === entryName) ?? { enabled: false };
				return enabled;
			}),
		}));

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
