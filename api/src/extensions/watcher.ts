import { ExtensionManager } from "./extensions";
import logger from '../logger';
import path from 'path';
import { isIn, isTypeIn, pluralize } from "@directus/shared/utils";
import { HYBRID_EXTENSION_TYPES, NESTED_EXTENSION_TYPES } from "@directus/shared/constants";
import { pathToRelativeUrl } from "@directus/shared/utils/node";
import env from '../env';
import chokidar, { FSWatcher } from 'chokidar';
import { Extension } from "@directus/shared/types";


export class WatcherManager {
    private extensionManager: ExtensionManager;
    private watcher: FSWatcher | null = null;

    constructor(extensionManager: ExtensionManager) {
        this.extensionManager = extensionManager;
    }

    public initializeWatcher(): void {
		if (!this.watcher) {
			logger.info('Watching extensions for changes...');

			const localExtensionPaths = NESTED_EXTENSION_TYPES.flatMap((type) => {
				const typeDir = path.posix.join(pathToRelativeUrl(env.EXTENSIONS_PATH), pluralize(type));

				if (isIn(type, HYBRID_EXTENSION_TYPES)) {
					return [path.posix.join(typeDir, '*', 'app.js'), path.posix.join(typeDir, '*', 'api.js')];
				} else {
					return path.posix.join(typeDir, '*', 'index.js');
				}
			});

			this.watcher = chokidar.watch([path.resolve('package.json'), ...localExtensionPaths], {
				ignoreInitial: true,
			});

			this.watcher
				.on('add', () => this.extensionManager.reload())
				.on('change', () => this.extensionManager.reload())
				.on('unlink', () => this.extensionManager.reload());
		}
	}

	public async closeWatcher(): Promise<void> {
		if (this.watcher) {
			await this.watcher.close();
		}
	}

	public updateWatchedExtensions(added: Extension[], removed: Extension[] = []): void {
		if (this.watcher) {
			const toPackageExtensionPaths = (extensions: Extension[]) =>
				extensions
					.filter((extension) => !extension.local)
					.flatMap((extension) =>
						isTypeIn(extension, HYBRID_EXTENSION_TYPES) || extension.type === 'bundle'
							? [
									path.resolve(extension.path, extension.entrypoint.app),
									path.resolve(extension.path, extension.entrypoint.api),
							  ]
							: path.resolve(extension.path, extension.entrypoint)
					);

			const addedPackageExtensionPaths = toPackageExtensionPaths(added);
			const removedPackageExtensionPaths = toPackageExtensionPaths(removed);

			this.watcher.add(addedPackageExtensionPaths);
			this.watcher.unwatch(removedPackageExtensionPaths);
		}
	}
}