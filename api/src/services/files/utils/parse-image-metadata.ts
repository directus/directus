const IPTC_ENTRY_TYPES = new Map([
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

function readTag(source: string, tag: string, offset = 0): { value: string; end: number } | undefined {
	const openTagPattern = new RegExp(`<${tag}>`, 'gi');
	openTagPattern.lastIndex = offset;

	if (openTagPattern.exec(source) === null) return;

	const valueStart = openTagPattern.lastIndex;
	const closeTagPattern = new RegExp(`</${tag}>`, 'gi');
	closeTagPattern.lastIndex = valueStart;

	const closeTagMatch = closeTagPattern.exec(source);

	if (closeTagMatch === null) return;

	const tagEnd = closeTagPattern.lastIndex;
	const valueEnd = closeTagMatch.index;
	const value = source.slice(valueStart, valueEnd);

	return { value, end: tagEnd };
}

function readTagList(source: string, tag: string): string[] {
	const items: string[] = [];
	let item = readTag(source, tag);

	while (item) {
		items.push(item.value);
		item = readTag(source, tag, item.end);
	}

	return items;
}

export function parseXmp(buffer: Buffer): Record<string, unknown> {
	const xmp: Record<string, unknown> = {};
	const source = buffer.toString();

	for (const name of ['title', 'description', 'rights', 'creator', 'subject']) {
		const tag = readTag(source, `dc:${name}`);

		if (tag === undefined) continue;

		const value = tag.value.trim();

		if (value.toLowerCase().startsWith('<rdf:bag>')) {
			xmp[name] = readTagList(value, 'rdf:li');
		} else {
			xmp[name] = value.replace(/<[^>]*>?/gm, '').trim();
		}
	}

	return xmp;
}
