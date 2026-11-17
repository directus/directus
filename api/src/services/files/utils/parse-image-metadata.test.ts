import { describe, expect, test } from 'vitest';
import { parseXmp } from './parse-image-metadata.js';

const xmp = (source: string) => parseXmp(Buffer.from(source));

describe('parseXmp', () => {
	test('reads the fields of a packet', () => {
		const packet = `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?><x:xmpmeta xmlns:x="adobe:ns:meta/">
			<rdf:RDF><rdf:Description>
				<dc:title><rdf:Alt><rdf:li xml:lang="x-default">A photo</rdf:li></rdf:Alt></dc:title>
				<dc:subject><rdf:Bag><rdf:li>sky</rdf:li><rdf:li>sea</rdf:li></rdf:Bag></dc:subject>
				<dc:creator><rdf:Seq><rdf:li>Ada</rdf:li></rdf:Seq></dc:creator>
			</rdf:Description></rdf:RDF></x:xmpmeta><?xpacket end="w"?>`;

		expect(xmp(packet)).toStrictEqual({ title: 'A photo', subject: ['sky', 'sea'], creator: 'Ada' });
	});

	test('reads a plain value', () => {
		expect(xmp('<dc:title>Hello world</dc:title>')).toStrictEqual({ title: 'Hello world' });
	});

	test('reads a value spanning several lines', () => {
		expect(xmp('<dc:title>line one\nline two</dc:title>')).toStrictEqual({ title: 'line one\nline two' });
	});

	test('trims the surrounding whitespace', () => {
		expect(xmp('<dc:title>   padded   </dc:title>')).toStrictEqual({ title: 'padded' });
	});

	test('strips markup from inside a value', () => {
		expect(xmp('<dc:description><p>bold <b>bit</b></p></dc:description>')).toStrictEqual({ description: 'bold bit' });
	});

	test('collects the items of a bag', () => {
		expect(xmp('<dc:subject><rdf:bag><rdf:li>a</rdf:li><rdf:li>b</rdf:li></rdf:bag></dc:subject>')).toStrictEqual({
			subject: ['a', 'b'],
		});
	});

	test('stops collecting at an unclosed item', () => {
		expect(xmp('<dc:subject><rdf:bag><rdf:li>a</rdf:li><rdf:li>b</rdf:bag></dc:subject>')).toStrictEqual({
			subject: ['a'],
		});
	});

	test('only treats a bag as a list when the value opens with one', () => {
		expect(xmp('<dc:subject>text <rdf:bag><rdf:li>x</rdf:li></rdf:bag></dc:subject>')).toStrictEqual({
			subject: 'text x',
		});
	});

	test.each([
		['uppercase', '<DC:TITLE>Shouty</DC:TITLE>', 'Shouty'],
		['mixed case', '<Dc:Title>Mixed</dC:tItLe>', 'Mixed'],
	])('matches tags in %s', (_label, source, expected) => {
		expect(xmp(source)).toStrictEqual({ title: expected });
	});

	test('keeps an empty value', () => {
		expect(xmp('<dc:title></dc:title>')).toStrictEqual({ title: '' });
	});

	test('takes the first of several values', () => {
		expect(xmp('<dc:title>first</dc:title><dc:title>second</dc:title>')).toStrictEqual({ title: 'first' });
	});

	test('ignores a closing tag that precedes the opening one', () => {
		expect(xmp('</dc:title><dc:title>after</dc:title>')).toStrictEqual({ title: 'after' });
	});

	test.each([
		['there are no tags', 'not xmp at all'],
		['the tag is never closed', '<dc:title>never ends'],
	])('reports no field when %s', (_label, source) => {
		expect(xmp(source)).toStrictEqual({});
	});

	test('finishes on a packet of opening tags that are never closed', () => {
		// The pattern was `<dc:title>(.*?)</dc:title>`, which scans to the end of the packet for every
		// opening tag. At this size that took ~11s, so a regression fails on the test timeout rather
		// than on a measured duration.
		expect(xmp('<dc:title>'.repeat(100_000))).toStrictEqual({});
	});
});
