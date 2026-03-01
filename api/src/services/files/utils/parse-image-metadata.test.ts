import { describe, expect, it } from 'vitest';
import { IPTC_ENTRY_TYPES, serializeIptc } from './parse-image-metadata.js';

/**
 * Parse IPTC entries from a serialized buffer by reading the binary format directly.
 * Each entry is: [0x1c, 0x02, tag, sizeHi, sizeLo, ...data]
 */
function readIptcEntries(buffer: Buffer): Array<{ tag: number; data: string }> {
	const entries: Array<{ tag: number; data: string }> = [];
	let pos = 0;

	while (pos + 5 <= buffer.byteLength) {
		if (buffer[pos] === 0x1c && buffer[pos + 1] === 0x02) {
			const tag = buffer[pos + 2]!;
			const size = buffer.readUInt16BE(pos + 3);
			const data = buffer.subarray(pos + 5, pos + 5 + size).toString('utf-8');
			entries.push({ tag, data });
			pos += 5 + size;
		} else {
			pos++;
		}
	}

	return entries;
}

/** Reverse lookup: name → tag byte */
function getTagForName(name: string): number | undefined {
	for (const [tag, n] of IPTC_ENTRY_TYPES) {
		if (n === name) return tag;
	}

	return undefined;
}

describe('serializeIptc', () => {
	it('returns empty buffer for empty input', () => {
		const result = serializeIptc({});
		expect(result.byteLength).toBe(0);
	});

	it('ignores unknown keys not in IPTC_ENTRY_TYPES', () => {
		const result = serializeIptc({ unknownField: 'value', anotherUnknown: 'test' });
		expect(result.byteLength).toBe(0);
	});

	it('serializes a single string field with correct binary format', () => {
		const buffer = serializeIptc({ copyright: '© 2025 Test Author' });
		const entries = readIptcEntries(buffer);

		expect(entries).toHaveLength(1);
		expect(entries[0]!.tag).toBe(getTagForName('copyright'));
		expect(entries[0]!.data).toBe('© 2025 Test Author');
	});

	it('serializes multiple fields', () => {
		const input = {
			copyright: '© 2025 Test',
			caption: 'A test image',
			headline: 'Test Headline',
			byline: 'Photographer Name',
		};

		const buffer = serializeIptc(input);
		const entries = readIptcEntries(buffer);

		expect(entries).toHaveLength(4);

		const byName = new Map(entries.map((e) => [e.tag, e.data]));
		expect(byName.get(getTagForName('copyright')!)).toBe('© 2025 Test');
		expect(byName.get(getTagForName('caption')!)).toBe('A test image');
		expect(byName.get(getTagForName('headline')!)).toBe('Test Headline');
		expect(byName.get(getTagForName('byline')!)).toBe('Photographer Name');
	});

	it('handles array values (e.g. multiple keywords)', () => {
		const buffer = serializeIptc({ keywords: ['nature', 'landscape', 'sunset'] });
		const entries = readIptcEntries(buffer);

		const keywordTag = getTagForName('keywords')!;
		const keywordEntries = entries.filter((e) => e.tag === keywordTag);

		expect(keywordEntries).toHaveLength(3);
		expect(keywordEntries.map((e) => e.data)).toEqual(['nature', 'landscape', 'sunset']);
	});

	it('skips null and undefined values', () => {
		const buffer = serializeIptc({ copyright: null, caption: undefined, headline: 'Valid' });
		const entries = readIptcEntries(buffer);

		expect(entries).toHaveLength(1);
		expect(entries[0]!.tag).toBe(getTagForName('headline'));
		expect(entries[0]!.data).toBe('Valid');
	});

	it('converts non-string values to strings', () => {
		const buffer = serializeIptc({ caption: 12345 });
		const entries = readIptcEntries(buffer);

		expect(entries).toHaveLength(1);
		expect(entries[0]!.data).toBe('12345');
	});

	it('serializes all known IPTC entry types', () => {
		const input: Record<string, string> = {};

		for (const [, name] of IPTC_ENTRY_TYPES) {
			input[name] = `test-${name}`;
		}

		const buffer = serializeIptc(input);
		const entries = readIptcEntries(buffer);

		expect(entries).toHaveLength(IPTC_ENTRY_TYPES.size);

		for (const [tag, name] of IPTC_ENTRY_TYPES) {
			const entry = entries.find((e) => e.tag === tag);
			expect(entry, `entry for ${name} (0x${tag.toString(16)})`).toBeDefined();
			expect(entry!.data).toBe(`test-${name}`);
		}
	});

	it('produces valid IPTC binary markers', () => {
		const buffer = serializeIptc({ copyright: 'test' });

		// First two bytes should be IPTC entry marker
		expect(buffer[0]).toBe(0x1c);
		expect(buffer[1]).toBe(0x02);

		// Third byte should be the copyright tag
		expect(buffer[2]).toBe(0x74);

		// Bytes 3-4 should be the data length (4 for "test")
		expect(buffer.readUInt16BE(3)).toBe(4);

		// Remaining bytes should be the data
		expect(buffer.subarray(5).toString('utf-8')).toBe('test');
	});
});
