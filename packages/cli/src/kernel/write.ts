import { chmodSync, closeSync, fsyncSync, openSync, renameSync, rmSync, writeFileSync } from 'node:fs';

// Write atomically: a crash or partial write never leaves a corrupt or truncated
// file at `path` (which, for the credential store, would wipe every saved token).
// Write to a same-directory temp, flush it to disk, then rename over the target —
// rename is atomic on the same filesystem. The directory must already exist.
export function writeFileAtomic(path: string, data: string, mode: number): void {
	const tmp = `${path}.${process.pid}.${Date.now()}.tmp`;

	try {
		const fd = openSync(tmp, 'w', mode);

		try {
			writeFileSync(fd, data);
			fsyncSync(fd);
		} finally {
			closeSync(fd);
		}

		renameSync(tmp, path);
		// Enforce the mode exactly, regardless of umask on the temp's creation.
		chmodSync(path, mode);
	} catch (error) {
		rmSync(tmp, { force: true });
		throw error;
	}
}
