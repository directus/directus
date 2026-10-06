import { fsyncSync, mkdtempSync, openSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { writeFileAtomic } from './write.js';

vi.mock('node:fs', async (importOriginal) => {
	const actual = await importOriginal<typeof import('node:fs')>();
	return { ...actual, fsyncSync: vi.fn(actual.fsyncSync), openSync: vi.fn(actual.openSync) };
});

const actualFs = await vi.importActual<typeof import('node:fs')>('node:fs');

describe('writeFileAtomic', () => {
	const dirs: string[] = [];

	function tempDir(): string {
		const dir = mkdtempSync(join(tmpdir(), 'd6s-write-'));
		dirs.push(dir);
		return dir;
	}

	afterEach(() => {
		vi.mocked(openSync).mockReset().mockImplementation(actualFs.openSync);
		vi.mocked(fsyncSync).mockReset().mockImplementation(actualFs.fsyncSync);
		for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
	});

	it('fsyncs the containing directory after the rename so the entry itself is power-loss durable', () => {
		const dir = tempDir();
		const path = join(dir, 'artifact.json');

		writeFileAtomic(path, 'data\n', 0o644);

		expect(readFileSync(path, 'utf8')).toBe('data\n');

		const open = vi.mocked(openSync).mock;
		const dirOpen = open.calls.findIndex(([target]) => target === dir);
		expect(dirOpen).toBeGreaterThanOrEqual(0);

		const dirFd = open.results[dirOpen]?.value as number;
		const fsync = vi.mocked(fsyncSync).mock;
		expect(fsync.calls).toEqual([[expect.any(Number)], [dirFd]]);
		expect(fsync.invocationCallOrder[1]).toBeGreaterThan(open.invocationCallOrder[dirOpen] as number);
	});

	it('still succeeds when the platform cannot fsync a directory', () => {
		const dir = tempDir();
		const path = join(dir, 'artifact.json');
		const dirFds = new Set<number>();

		vi.mocked(openSync).mockImplementation((target, flags, mode) => {
			const fd = actualFs.openSync(target, flags, mode);
			if (target === dir) dirFds.add(fd);
			return fd;
		});

		vi.mocked(fsyncSync).mockImplementation((fd) => {
			if (dirFds.has(fd)) throw Object.assign(new Error('EINVAL: invalid argument, fsync'), { code: 'EINVAL' });
			actualFs.fsyncSync(fd);
		});

		writeFileAtomic(path, 'data\n', 0o644);
		expect(readFileSync(path, 'utf8')).toBe('data\n');
		expect(dirFds.size).toBeGreaterThan(0);
	});
});
