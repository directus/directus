/**
 * class to help tracking file status between local and remote
 */
import { readdir, rm } from 'node:fs/promises';
import { dirname, join, relative, sep } from 'node:path';

export class SyncFileTracker {
    private localFiles: Set<string>;
    private trackedDirs: Set<string>;

    constructor() {
        this.localFiles = new Set();
        this.trackedDirs = new Set();
    }

    async readLocalFiles(localExtensionsPath: string) {
        const entries = await readdir(localExtensionsPath, { recursive: true, withFileTypes: true });
        
        for (const entry of entries) {
            if (!entry.isFile()) continue;
            const relativePath = join(relative(localExtensionsPath, entry.parentPath), entry.name);
            this.localFiles.add(relativePath);
        }
    }

    async syncFile(filePath: string) {
        this.localFiles.delete(filePath);
        let currentDir = dirname(filePath);

        while (currentDir !== '.') {
            if (this.trackedDirs.has(currentDir)) break;
            this.trackedDirs.add(currentDir);
            currentDir = dirname(currentDir);
        }
    }

    async cleanup(localExtensionsPath: string) {
        const removeDirs = new Set<string>();
    
        for (const removeFile of this.localFiles) {
            if (removeFile === '.status') continue;
            let currentDir = dirname(removeFile);

            while (currentDir !== localExtensionsPath) {
                if (this.trackedDirs.has(currentDir)) break;
                removeDirs.add(currentDir);
                currentDir = dirname(currentDir);
            }
        }

        const removeDirsRecursive = Array.from(removeDirs)
            .sort((a, b) => pathDepth(b) - pathDepth(a))
            .filter((d) => !removeDirs.has(dirname(d)));

        for (const dir of removeDirsRecursive) {
            const relativePath = join(localExtensionsPath, dir);
            console.log('Removing:', relativePath);
            await rm(relativePath, { recursive: true, force: true });
        }
    }
}

function pathDepth(path: string): number {
    let count = 0;

    for (let i = 0; i < path.length; i++) {
        if (path[i] === sep) count++;
    }

    return count;
}
