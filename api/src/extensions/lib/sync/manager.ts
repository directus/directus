/**
 * 
 */
import { useEnv } from '@directus/env';
import mid from 'node-machine-id';
import { mkdir, readdir, rm, stat } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { getExtensionsPath } from "../get-extensions-path.js";
import { getStorage } from '../../../storage/index.js';

export class ExtensionSyncManager {
    public localRootPath: string;
    public remoteRootPath: string;

    private localFiles: Set<string>;
    private remoteFiles: Set<string>;

    constructor() {
	    const env = useEnv();
        this.localRootPath = getExtensionsPath();
        this.remoteRootPath = env['EXTENSIONS_PATH'] as string;

        this.localFiles = new Set();
        this.remoteFiles = new Set();
    }

    async ensureLocalDirectoryExists() {
        await mkdir(this.localRootPath, { recursive: true });
    }

    async getRemoteDisk() {
	    const env = useEnv();
        const storage = await getStorage();
        return storage.location(env['EXTENSIONS_LOCATION'] as string);
    }

    async readLocalFiles() {
	    const entries = await readdir(this.localRootPath, { recursive: true, withFileTypes: true });
        
        for (const entry of entries) {
            if (!entry.isFile()) continue;
            const relativePath = join(relative(this.localRootPath, entry.parentPath), entry.name);
            this.localFiles.add(relativePath);
        }
    }

    async readRemoteFiles() {
        const disk = await this.getRemoteDisk();
        return disk.list(this.remoteRootPath);
    }

    setRemoteFile(filePath: string) {
        this.remoteFiles.add(filePath);
        this.localFiles.delete(filePath);
    }

    async cleanup() {
        // Now we can determine which directories will be empty
        const dirsWithRemoteFiles = new Set<string>();
    
        // Track all directories that contain remote files
        for (const remoteFile of this.remoteFiles) {
            let currentDir = dirname(join(this.localRootPath, remoteFile));
    
            while (currentDir !== this.localRootPath) {
                dirsWithRemoteFiles.add(currentDir);
                currentDir = dirname(currentDir);
            }
        }
        
        // Collect all directories from files we're removing
        const removeDirs = new Set<string>();
    
        for (const removeFile of this.localFiles) {
            if (removeFile === '.status') continue;
    
            const removePath = join(this.localRootPath, removeFile);
            let currentDir = dirname(removePath);
    
            while (currentDir !== this.localRootPath) {
                removeDirs.add(currentDir);
                currentDir = dirname(currentDir);
            }
        }
        
        // Find directories that can be removed recursively (no remote files in them or subdirectories)
        const dirsToRemoveRecursively = Array.from(removeDirs)
            .filter(dir => !dirsWithRemoteFiles.has(dir))
            .sort((a, b) => pathDepth(a) - pathDepth(b)); // Shallowest first
    
        console.log({dirsToRemoveRecursively});
    
        // Remove entire directory trees at once
        const removedDirs = new Set<string>();
    
        for (const removeDir of dirsToRemoveRecursively) {
            // Skip if already removed as part of a parent directory
            let alreadyRemoved = false;
    
            for (const removed of removedDirs) {
                if (removeDir.startsWith(removed + sep)) {
                    alreadyRemoved = true;
                    break;
                }
            }
    
            if (!alreadyRemoved) {
                console.log('removing dir recursively:', removeDir);
    
                await rm(removeDir, { recursive: true, force: true })
                    .catch((e) => { console.error('e2', e); });
    
                removedDirs.add(removeDir);
            }
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