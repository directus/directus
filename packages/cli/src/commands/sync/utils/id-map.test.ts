import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { type IdMap, mappingsFor, normalizeInstanceUrl, readIdMap, withMappings, writeIdMap } from './id-map.js';
import { expectCliError } from './test-support.js';

const A = 'http://source.example.com';
const B = 'http://target.example.com';
const A_TO_B = { sourceUrl: A, targetUrl: B };
const B_TO_A = { sourceUrl: B, targetUrl: A };

const dirs: string[] = [];

function tempDir(): string {
	const dir = mkdtempSync(join(tmpdir(), 'd6s-idmap-'));
	dirs.push(dir);
	return dir;
}

function mapPath(): string {
	return join(tempDir(), 'default', 'id_map.json');
}

afterEach(() => {
	for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('normalizeInstanceUrl', () => {
	it('normalizes equivalent URLs without collapsing meaningful paths or ports', () => {
		const cases = [
			['HTTPS://Example.COM', 'https://example.com'],
			['http://example.com:80', 'http://example.com'],
			['https://example.com:443', 'https://example.com'],
			['http://example.com/', 'http://example.com'],
			['http://example.com/directus', 'http://example.com/directus'],
			['http://example.com/directus/', 'http://example.com/directus'],
			['http://[::1]:8055', 'http://[::1]:8055'],
		] as const;

		for (const [input, expected] of cases) expect(normalizeInstanceUrl(input)).toBe(expected);
	});
});

describe('readIdMap / writeIdMap', () => {
	it('reads an absent file as the empty map', () => {
		expect(readIdMap(mapPath())).toEqual({ formatVersion: 1, maps: {} });
	});

	it('round-trips a written map through read', () => {
		const path = mapPath();
		const map = withMappings(readIdMap(path), A_TO_B, 'directus_roles', { s1: 't1', s2: 't2' });

		writeIdMap(path, map);

		expect(readIdMap(path)).toEqual(map);
	});

	// A cloned repo can carry a symlink where the ID map belongs; reading through it trusts a file outside the project.
	it('refuses a symlinked id_map.json instead of reading through it', () => {
		const path = mapPath();
		writeIdMap(path, withMappings(readIdMap(path), A_TO_B, 'directus_roles', { s1: 't1' }));

		const escaped = join(tempDir(), 'id_map.json');
		writeFileSync(escaped, readFileSync(path, 'utf8'));
		rmSync(path, { force: true });
		symlinkSync(escaped, path);

		const error = expectCliError(() => readIdMap(path));

		expect(error.code).toBe('STATE');
		expect(error.message).toContain('is not a regular file');
	});

	it('writes byte-identical bytes regardless of key insertion order', () => {
		const first = withMappings(
			withMappings(readIdMap(mapPath()), A_TO_B, 'directus_roles', { s2: 't2' }),
			A_TO_B,
			'directus_roles',
			{ s1: 't1' },
		);

		const second = withMappings(
			withMappings(readIdMap(mapPath()), A_TO_B, 'directus_roles', { s1: 't1' }),
			A_TO_B,
			'directus_roles',
			{ s2: 't2' },
		);

		const pathA = mapPath();
		const pathB = mapPath();
		writeIdMap(pathA, first);
		writeIdMap(pathB, second);

		expect(readFileSync(pathA, 'utf8')).toBe(readFileSync(pathB, 'utf8'));
	});
});

describe('withMappings', () => {
	it('merges new entries into a collection bucket without dropping existing ones', () => {
		const base = withMappings(readIdMap(mapPath()), A_TO_B, 'directus_roles', { s1: 't1' });
		const merged = withMappings(base, A_TO_B, 'directus_roles', { s2: 't2' });

		expect(mappingsFor(merged, A_TO_B)['directus_roles']).toEqual({ s1: 't1', s2: 't2' });
	});

	it('fails STATE at write when a new entry maps a second source to an already-owned target id', () => {
		const base = withMappings(readIdMap(mapPath()), A_TO_B, 'directus_roles', { s1: 't1' });

		const error = expectCliError(() => withMappings(base, A_TO_B, 'directus_roles', { s2: 't1' }));

		expect(error.code).toBe('STATE');
		expect(error.message).toContain('"s1"');
		expect(error.message).toContain('"s2"');
		expect(error.message).toContain('"t1"');
	});

	it('fails STATE when a single entries batch maps two sources to the same target id', () => {
		const error = expectCliError(() =>
			withMappings(readIdMap(mapPath()), A_TO_B, 'directus_roles', { s1: 't1', s2: 't1' }),
		);

		expect(error.code).toBe('STATE');
		expect(error.message).toContain('"t1"');
	});

	it('preserves map identity when every entry is already in the bucket', () => {
		const base = withMappings(readIdMap(mapPath()), A_TO_B, 'directus_roles', { s1: 't1', s2: 't2' });

		expect(withMappings(base, A_TO_B, 'directus_roles', { s1: 't1' })).toBe(base);
		expect(withMappings(base, A_TO_B, 'directus_roles', {})).toBe(base);
		expect(withMappings(base, A_TO_B, 'directus_roles', { s1: 't9' })).not.toBe(base);
	});

	it('keeps source→target and target→source in separate buckets', () => {
		const map = withMappings(
			withMappings(readIdMap(mapPath()), A_TO_B, 'directus_roles', { x: 'forward' }),
			B_TO_A,
			'directus_roles',
			{ x: 'reverse' },
		);

		expect(mappingsFor(map, A_TO_B)['directus_roles']).toEqual({ x: 'forward' });
		expect(mappingsFor(map, B_TO_A)['directus_roles']).toEqual({ x: 'reverse' });
	});
});

describe('mappingsFor', () => {
	it('finds the bucket for a differently-spelled but equivalent URL', () => {
		const map = withMappings(
			readIdMap(mapPath()),
			{ sourceUrl: 'http://host', targetUrl: 'http://target' },
			'directus_roles',
			{
				s1: 't1',
			},
		);

		expect(mappingsFor(map, { sourceUrl: 'http://host:80/', targetUrl: 'http://target' })['directus_roles']).toEqual({
			s1: 't1',
		});
	});
});

describe('prototype safety', () => {
	it('round-trips a record ID literally named __proto__ without polluting Object.prototype', () => {
		const path = mapPath();
		const entries = JSON.parse('{"__proto__": "target-x"}') as Record<string, string>;
		const map = withMappings(readIdMap(path), A_TO_B, 'directus_roles', entries);

		writeIdMap(path, map);

		const serialized = readFileSync(path, 'utf8');
		expect(serialized).toContain('"__proto__"');

		const bucket = mappingsFor(readIdMap(path), A_TO_B)['directus_roles'] ?? {};

		expect(Object.keys(bucket)).toContain('__proto__');
		expect(Object.getPrototypeOf(bucket)).toBe(Object.prototype);
		expect((Object.prototype as Record<string, unknown>)['target-x']).toBeUndefined();
		expect(({} as Record<string, unknown>)['__proto__']).toBe(Object.prototype);
	});
});

describe('readIdMap failures', () => {
	it('fails STATE naming the path on invalid JSON', () => {
		const path = mapPath();
		writeIdMap(path, { formatVersion: 1, maps: {} });
		writeFileSync(path, '{ not valid json');

		const error = expectCliError(() => readIdMap(path));

		expect(error.code).toBe('STATE');
		expect(error.message).toContain(path);
	});

	it('fails STATE naming the path on an unsupported formatVersion', () => {
		const path = mapPath();
		writeFileSync(mkdirForFile(path), JSON.stringify({ formatVersion: 2, maps: {} }));

		const error = expectCliError(() => readIdMap(path));

		expect(error.code).toBe('STATE');
		expect(error.message).toContain(path);
		expect(error.message).toMatch(/formatVersion/);
	});

	it('fails STATE when two sources map to the same target id — a bucket must be injective', () => {
		const path = mapPath();

		writeFileSync(
			mkdirForFile(path),
			JSON.stringify({ formatVersion: 1, maps: { [A]: { [B]: { directus_roles: { s1: 't1', s2: 't1' } } } } }),
		);

		const error = expectCliError(() => readIdMap(path));

		expect(error.code).toBe('STATE');
		expect(error.message).toContain('"s1"');
		expect(error.message).toContain('"s2"');
		expect(error.message).toContain('"t1"');
	});

	it('fails STATE naming the path when a leaf is not a string', () => {
		const path = mapPath();

		writeFileSync(
			mkdirForFile(path),
			JSON.stringify({ formatVersion: 1, maps: { [A]: { [B]: { directus_roles: { s1: 42 } } } } }),
		);

		const error = expectCliError(() => readIdMap(path));

		expect(error.code).toBe('STATE');
		expect(error.message).toContain(path);
	});
});

function mkdirForFile(path: string): string {
	const map: IdMap = { formatVersion: 1, maps: {} };
	writeIdMap(path, map);
	return path;
}
