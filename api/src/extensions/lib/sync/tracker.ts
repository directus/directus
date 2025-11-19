/**
 * class to help tracking file status between local and remote
 */
import { readdir, rm } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { pathDepth } from './utils.js';

export class SyncFileTracker {
	private localFiles: Set<string>;
	private trackedDirs: Set<string>;

	constructor() {
		this.localFiles = new Set();
		this.trackedDirs = new Set();
	}

	/**
	 * Reads all files recusrively in the provided directory
	 * @returns the number of files read
	 */
	async readLocalFiles(localExtensionsPath: string): Promise<number> {
		const entries = await readdir(localExtensionsPath, { recursive: true, withFileTypes: true }).catch(() => {
			/* path doesnt exist */
		});

		if (!entries) return 0;

		for (const entry of entries) {
			if (!entry.isFile()) continue;
			const relativePath = join(relative(localExtensionsPath, entry.parentPath), entry.name);
			this.localFiles.add(relativePath);
		}

		return this.localFiles.size;
	}

	/**
	 * Removes a file from the locally tracked files
	 */
	async passedFile(filePath: string) {
		this.localFiles.delete(filePath);
		let currentDir = dirname(filePath);

		while (currentDir !== '.') {
			if (this.trackedDirs.has(currentDir)) break;
			this.trackedDirs.add(currentDir);
			currentDir = dirname(currentDir);
		}
	}

	/**
	 * Removes left over tracked files that were not processed
	 */
	async cleanup(localExtensionsPath: string) {
		const removeDirs = new Set<string>();

		for (const removeFile of this.localFiles) {
			if (removeFile === '.status') continue;
			let currentDir = dirname(removeFile);

			while (currentDir !== localExtensionsPath && currentDir !== '.') {
				if (this.trackedDirs.has(currentDir)) break;
				removeDirs.add(currentDir);
				currentDir = dirname(currentDir);
			}
		}

		// sort directory by depth so we can remove the highest level directory recursively
		const removeDirsRecursive = Array.from(removeDirs)
			.sort((a, b) => pathDepth(b) - pathDepth(a))
			.filter((d) => !removeDirs.has(dirname(d)));

		for (const dir of removeDirsRecursive) {
			const relativePath = join(localExtensionsPath, dir);
			// removing local folder that does not exist in the remote storage
			await rm(relativePath, { recursive: true, force: true });
		}
	}
}

