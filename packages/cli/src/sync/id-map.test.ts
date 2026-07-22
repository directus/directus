import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { CliError } from '../kernel/error.js';
import { type IdMap, mappingsFor, normalizeInstanceUrl, readIdMap, withMappings, writeIdMap } from './id-map.js';

const A = 'http://source.example.com';
const B = 'http://target.example.com';

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

function expectCliError(fn: () => unknown): CliError {
	try {
		fn();
	} catch (error) {
		expect(error).toBeInstanceOf(CliError);
		return error as CliError;
	}

	throw new Error('expected a CliError');
}

describe('normalizeInstanceUrl', () => {
	it('lowercases protocol and host so case-variant URLs key one bucket', () => {
		// A profile spelled HTTPS://Example.COM and https://example.com are the same instance; keying them
		// apart would strand the second import with no seeded mappings and reduplicate every record.
		expect(normalizeInstanceUrl('HTTPS://Example.COM')).toBe('https://example.com');
	});

	it('drops the protocol default port so :80 and :443 collapse to the bare host', () => {
		expect(normalizeInstanceUrl('http://example.com:80')).toBe('http://example.com');
		expect(normalizeInstanceUrl('https://example.com:443')).toBe('https://example.com');
	});

	it('strips trailing slashes at the root and after a real path', () => {
		// `/directus` and `/directus/` are SDK-equivalent; keying them apart would orphan two ID-map
		// buckets for one instance and reduplicate every record pushed under the second spelling.
		expect(normalizeInstanceUrl('http://example.com/')).toBe('http://example.com');
		expect(normalizeInstanceUrl('http://example.com/directus')).toBe('http://example.com/directus');
		expect(normalizeInstanceUrl('http://example.com/directus/')).toBe('http://example.com/directus');
	});

	it('keeps an IPv6 host and its non-default port intact', () => {
		// The whole reason the map nests URLs instead of joining them on a delimiter: an IPv6 host embeds
		// colons, so a composite key would split mid-address. The brackets and port must survive verbatim.
		expect(normalizeInstanceUrl('http://[::1]:8055')).toBe('http://[::1]:8055');
	});
});

describe('readIdMap / writeIdMap', () => {
	it('reads an absent file as the empty map', () => {
		// A first sync has no map yet; treating the missing file as empty is what lets reconcile seed it,
		// rather than failing before the very run that would create it.
		expect(readIdMap(mapPath())).toEqual({ formatVersion: 1, maps: {} });
	});

	it('round-trips a written map through read', () => {
		const path = mapPath();
		const map = withMappings(readIdMap(path), A, B, 'directus_roles', { s1: 't1', s2: 't2' });

		writeIdMap(path, map);

		expect(readIdMap(path)).toEqual(map);
	});

	it('writes byte-identical bytes regardless of key insertion order', () => {
		// The map is committed; its bytes must depend only on the mappings so a PR diff shows a real remap
		// and never incidental key ordering from however the entries were accumulated.
		const first = withMappings(
			withMappings(readIdMap(mapPath()), A, B, 'directus_roles', { s2: 't2' }),
			A,
			B,
			'directus_roles',
			{ s1: 't1' },
		);

		const second = withMappings(
			withMappings(readIdMap(mapPath()), A, B, 'directus_roles', { s1: 't1' }),
			A,
			B,
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
		// Reconcile and successive imports append mappings; replacing the bucket would forget every record
		// mapped before this call and reduplicate it on the next import.
		const base = withMappings(readIdMap(mapPath()), A, B, 'directus_roles', { s1: 't1' });
		const merged = withMappings(base, A, B, 'directus_roles', { s2: 't2' });

		expect(mappingsFor(merged, A, B)['directus_roles']).toEqual({ s1: 't1', s2: 't2' });
	});

	it('returns the same map object for empty entries', () => {
		// A reconcile that seeds nothing must produce no write; returning the input unchanged lets the
		// caller detect the no-op by identity and skip touching the committed file.
		const base = withMappings(readIdMap(mapPath()), A, B, 'directus_roles', { s1: 't1' });

		expect(withMappings(base, A, B, 'directus_roles', {})).toBe(base);
	});

	it('keeps source→target and target→source in separate buckets', () => {
		// A remapping only holds one way; if A→B and B→A shared a bucket, a reverse sync would apply the
		// forward instance's IDs and corrupt every reference.
		const map = withMappings(
			withMappings(readIdMap(mapPath()), A, B, 'directus_roles', { x: 'forward' }),
			B,
			A,
			'directus_roles',
			{ x: 'reverse' },
		);

		expect(mappingsFor(map, A, B)['directus_roles']).toEqual({ x: 'forward' });
		expect(mappingsFor(map, B, A)['directus_roles']).toEqual({ x: 'reverse' });
	});
});

describe('mappingsFor', () => {
	it('returns an empty bucket for an unseeded pair', () => {
		expect(mappingsFor(readIdMap(mapPath()), A, B)).toEqual({});
	});

	it('finds the bucket for a differently-spelled but equivalent URL', () => {
		// Callers pass whatever the profile holds; normalizing on lookup means http://host:80 finds the
		// bucket seeded under http://host, instead of missing it and reduplicating.
		const map = withMappings(readIdMap(mapPath()), 'http://host', 'http://target', 'directus_roles', { s1: 't1' });

		expect(mappingsFor(map, 'http://host:80/', 'http://target')['directus_roles']).toEqual({ s1: 't1' });
	});
});

describe('prototype safety', () => {
	it('round-trips a record ID literally named __proto__ without polluting Object.prototype', () => {
		// A Directus primary key can be the string "__proto__". Building the map with obj[key] = value would
		// hit the prototype setter, dropping the mapping and risking global pollution; the id must survive as
		// an own key through write and read.
		const path = mapPath();
		const entries = JSON.parse('{"__proto__": "target-x"}') as Record<string, string>;
		const map = withMappings(readIdMap(path), A, B, 'directus_roles', entries);

		writeIdMap(path, map);

		const serialized = readFileSync(path, 'utf8');
		expect(serialized).toContain('"__proto__"');

		const bucket = mappingsFor(readIdMap(path), A, B)['directus_roles'] ?? {};

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
		// A future on-disk format the current CLI cannot read must stop loud, not be reinterpreted as
		// version 1 and seed imports from a shape it does not understand.
		const path = mapPath();
		writeFileSync(mkdirForFile(path), JSON.stringify({ formatVersion: 2, maps: {} }));

		const error = expectCliError(() => readIdMap(path));

		expect(error.code).toBe('STATE');
		expect(error.message).toContain(path);
		expect(error.message).toMatch(/formatVersion/);
	});

	it('fails STATE when two sources map to the same target id — a bucket must be injective', () => {
		// Two sources sharing one target row have no single identity: both would import onto the same row
		// (last write wins) and unchanged detection would lie for one of them. Reconcile cannot produce
		// this (committed targets are excluded from matching), so it is hand-edit/merge corruption and the
		// map must be refused, not trusted.
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
		// A non-string target ID means a hand-edited or corrupt map; coercing it would seed an import with a
		// bogus primary key, so it must fail loud rather than flow downstream.
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
