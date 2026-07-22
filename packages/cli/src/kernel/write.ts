import { chmodSync, closeSync, fsyncSync, openSync, renameSync, rmSync, writeFileSync } from 'node:fs';

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
	} catch (error) {
		rmSync(tmp, { force: true });
		throw error;
	}
}
