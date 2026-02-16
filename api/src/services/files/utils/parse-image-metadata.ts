export const IPTC_ENTRY_TYPES = new Map([
	[0x78, 'caption'],
	[0x6e, 'credit'],
	[0x19, 'keywords'],
	[0x37, 'dateCreated'],
	[0x50, 'byline'],
	[0x55, 'bylineTitle'],
	[0x7a, 'captionWriter'],
	[0x69, 'headline'],
	[0x74, 'copyright'],
	[0x0f, 'category'],
]);

const IPTC_ENTRY_MARKER = Buffer.from([0x1c, 0x02]);

export function parseIptc(buffer: Buffer): Record<string, unknown> {
	if (!Buffer.isBuffer(buffer)) return {};

	const iptc: Record<string, any> = {};
	let lastIptcEntryPos = buffer.indexOf(IPTC_ENTRY_MARKER);

	while (lastIptcEntryPos !== -1) {
		lastIptcEntryPos = buffer.indexOf(IPTC_ENTRY_MARKER, lastIptcEntryPos + IPTC_ENTRY_MARKER.byteLength);

		const iptcBlockTypePos = lastIptcEntryPos + IPTC_ENTRY_MARKER.byteLength;
		const iptcBlockSizePos = iptcBlockTypePos + 1;
		const iptcBlockDataPos = iptcBlockSizePos + 2;

		const iptcBlockType = buffer.readUInt8(iptcBlockTypePos);
		const iptcBlockSize = buffer.readUInt16BE(iptcBlockSizePos);

		if (!IPTC_ENTRY_TYPES.has(iptcBlockType)) {
			continue;
		}

		const iptcBlockTypeId = IPTC_ENTRY_TYPES.get(iptcBlockType);
		const iptcData = buffer.subarray(iptcBlockDataPos, iptcBlockDataPos + iptcBlockSize).toString();

		if (iptcBlockTypeId) {
			if (iptc[iptcBlockTypeId] == null) {
				iptc[iptcBlockTypeId] = iptcData;
			} else if (Array.isArray(iptc[iptcBlockTypeId])) {
				iptc[iptcBlockTypeId].push(iptcData);
			} else {
				iptc[iptcBlockTypeId] = [iptc[iptcBlockTypeId], iptcData];
			}
		}
	}

	return iptc;
}

export function serializeIptc(iptc: Record<string, unknown>): Buffer {
	const nameToTag = new Map<string, number>();

	for (const [tag, name] of IPTC_ENTRY_TYPES) {
		nameToTag.set(name, tag);
	}

	const buffers: Buffer[] = [];

	for (const [key, value] of Object.entries(iptc)) {
		const tag = nameToTag.get(key);

		if (tag === undefined) continue;

		const values = Array.isArray(value) ? value : [value];

		for (const v of values) {
			if (v == null) continue;

			const data = Buffer.from(String(v), 'utf-8');
			const entry = Buffer.alloc(IPTC_ENTRY_MARKER.byteLength + 1 + 2 + data.byteLength);

			IPTC_ENTRY_MARKER.copy(entry, 0);
			entry.writeUInt8(tag, IPTC_ENTRY_MARKER.byteLength);
			entry.writeUInt16BE(data.byteLength, IPTC_ENTRY_MARKER.byteLength + 1);
			data.copy(entry, IPTC_ENTRY_MARKER.byteLength + 1 + 2);

			buffers.push(entry);
		}
	}

	return Buffer.concat(buffers);
}

export function parseXmp(buffer: Buffer): Record<string, unknown> {
	const xmp: Record<string, unknown> = {};

	['title', 'description', 'rights', 'creator', 'subject'].forEach((x) => {
		const tagRegex = new RegExp(`<dc:${x}>(.*?)</dc:${x}>`, 'smig'),
			tagMatches = tagRegex.exec(buffer.toString());

		if (!tagMatches || tagMatches.length === 0) {
			return;
		}

		const value = tagMatches[1]?.trim();

		if (value?.toLowerCase().indexOf('<rdf:bag>') === 0) {
			const r = new RegExp('<rdf:li>(.*?)</rdf:li>', 'smig');
			let match = r.exec(value);
			const result = [];

			while (match) {
				result.push(match[1]);

				match = r.exec(value);
			}

			xmp[x] = result;
		} else {
			xmp[x] = value?.replace(/<[^>]*>?/gm, '').trim();
		}
	});

	return xmp;
}
