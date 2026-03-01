import { serializeIptc } from '../services/files/utils/parse-image-metadata.js';

/**
 * Build a JPEG APP13 segment containing IPTC-IIM data and inject it into a JPEG buffer.
 * The segment is inserted right after the SOI marker (0xFFD8).
 */
export function injectIptcIntoJpeg(jpeg: Buffer, iptc: Record<string, unknown>): Buffer {
	const iptcEntries = serializeIptc(iptc);

	if (iptcEntries.byteLength === 0) return jpeg;

	// Prepend IPTC-IIM record version entry (tag 0x00, version 4) as required by the spec.
	// parseIptc skips the first 0x1c02 marker it encounters, expecting it to be this record version.
	const recordVersion = Buffer.from([0x1c, 0x02, 0x00, 0x00, 0x02, 0x00, 0x04]);
	const iptcData = Buffer.concat([recordVersion, iptcEntries]);

	// Build 8BIM resource block for IPTC-IIM (resource ID 0x0404)
	const signature = Buffer.from('8BIM');
	const resourceId = Buffer.alloc(2);
	resourceId.writeUInt16BE(0x0404, 0);

	// Empty pascal string (name): single null byte, padded to even length
	const pascalName = Buffer.from([0x00, 0x00]);

	const dataSize = Buffer.alloc(4);
	dataSize.writeUInt32BE(iptcData.byteLength, 0);

	const resourceBlock = Buffer.concat([signature, resourceId, pascalName, dataSize, iptcData]);

	// Pad resource block to even length if needed
	const paddedBlock =
		resourceBlock.byteLength % 2 !== 0 ? Buffer.concat([resourceBlock, Buffer.from([0x00])]) : resourceBlock;

	// Build APP13 segment
	const photoshopId = Buffer.from('Photoshop 3.0\0', 'ascii');
	const segmentPayload = Buffer.concat([photoshopId, paddedBlock]);
	const segmentHeader = Buffer.alloc(4);
	segmentHeader.writeUInt16BE(0xffed, 0); // APP13 marker
	segmentHeader.writeUInt16BE(segmentPayload.byteLength + 2, 2); // length includes the 2 length bytes

	const app13Segment = Buffer.concat([segmentHeader, segmentPayload]);

	// Insert after SOI marker (first 2 bytes of JPEG)
	const soi = jpeg.subarray(0, 2);
	const rest = jpeg.subarray(2);

	return Buffer.concat([soi, app13Segment, rest]);
}
