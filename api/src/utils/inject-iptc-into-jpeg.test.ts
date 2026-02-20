import { describe, expect, it } from 'vitest';
import { parseIptc } from '../services/files/utils/parse-image-metadata.js';
import { injectIptcIntoJpeg } from './inject-iptc-into-jpeg.js';

/** Minimal valid JPEG: SOI marker followed by EOI marker */
function makeMinimalJpeg(): Buffer {
	return Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
}

describe('injectIptcIntoJpeg', () => {
	it('returns the original buffer unchanged when iptc is empty', () => {
		const jpeg = makeMinimalJpeg();
		const result = injectIptcIntoJpeg(jpeg, {});
		expect(result.equals(jpeg)).toBe(true);
	});

	it('round-trips IPTC fields through parseIptc', () => {
		const jpeg = makeMinimalJpeg();

		const iptc = {
			copyright: '© 2025 Ünïcödé',
			caption: 'A test image',
			headline: 'Test Headline',
			keywords: ['nature', 'landscape', 'sunset'],
			unknownField: 'should be ignored',
		};

		const result = injectIptcIntoJpeg(jpeg, iptc);
		const parsed = parseIptc(result);

		expect(parsed['copyright']).toBe('© 2025 Ünïcödé');
		expect(parsed['caption']).toBe('A test image');
		expect(parsed['headline']).toBe('Test Headline');
		expect(parsed['keywords']).toEqual(['nature', 'landscape', 'sunset']);
		expect(parsed['unknownField']).toBeUndefined();
	});
});
