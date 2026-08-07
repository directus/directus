import { chmodSync, closeSync, fsyncSync, openSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

/** Avoid partial files by flushing a same-directory temp before atomic rename. */
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
		chmodSync(path, mode);

		// The rename is only power-loss durable once the directory entry is flushed too; without it, sibling
		// renames can reach disk out of order. Best-effort: directory fsync is unsupported on some
		// platforms/filesystems (Windows), and durability hardening must not break the completed write there.
		try {
			const dirFd = openSync(dirname(path), 'r');

			try {
				fsyncSync(dirFd);
			} finally {
				closeSync(dirFd);
			}
		} catch {
			// Swallowed on purpose — see above.
		}
	} catch (error) {
		rmSync(tmp, { force: true });
		throw error;
	}
}
