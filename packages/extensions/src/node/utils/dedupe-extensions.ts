import type { Extension } from '../../shared/types/index.js';

type ExtensionSource = 'local' | 'registry' | 'module';

export type ExtensionMaps = Record<ExtensionSource, Map<string, Extension>>;

export type ShadowedExtension = {
	source: ExtensionSource;
	folder: string;
	extension: Extension;
	shadowedBy: { source: ExtensionSource; folder: string };
};

/** When the same extension is present in multiple sources, the copy from the first source in this order wins */
const SOURCE_PRECEDENCE: ExtensionSource[] = ['local', 'registry', 'module'];

/**
 * Remove extensions that are also present in a higher precedence source (local > registry > module),
 * matched by type and name. This prevents an extension that's e.g. both a local extension and listed as
 * a dependency from being registered twice. Copies within the same source are kept, as they're distinct
 * folders. The winning copy is kept regardless of its settings, so disabling it disables the extension
 * instead of activating a shadowed copy.
 */
export function dedupeExtensions(extensionMaps: ExtensionMaps): {
	extensions: ExtensionMaps;
	shadowed: ShadowedExtension[];
} {
	const extensions: ExtensionMaps = { module: new Map(), registry: new Map(), local: new Map() };
	const shadowed: ShadowedExtension[] = [];

	// type:name -> copy from a higher precedence source
	const winners = new Map<string, { source: ExtensionSource; folder: string }>();

	for (const source of SOURCE_PRECEDENCE) {
		const sourceWinners = new Map<string, { source: ExtensionSource; folder: string }>();

		for (const [folder, extension] of extensionMaps[source]) {
			const key = `${extension.type}:${extension.name}`;
			const winner = winners.get(key);

			if (winner) {
				shadowed.push({ source, folder, extension, shadowedBy: winner });
				continue;
			}

			if (!sourceWinners.has(key)) sourceWinners.set(key, { source, folder });
			extensions[source].set(folder, extension);
		}

		for (const [key, winner] of sourceWinners) winners.set(key, winner);
	}

	return { extensions, shadowed };
}
