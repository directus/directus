import { Readable, Transform } from 'node:stream';
import type { Sharp } from 'sharp';
import { expect, test, vi } from 'vitest';
import { getSharpInstance } from '../lib/get-sharp-instance.js';
import { getMetadata } from './get-metadata.js';

vi.mock('../lib/get-sharp-instance.js', () => ({
	getSharpInstance: vi.fn(),
}));

test('Resolves empty object on unexpected error in transformation', async () => {
	const stream = new Readable();
	stream._read = vi.fn();

	vi.mocked(getSharpInstance).mockImplementation(
		() =>
			({
				metadata: vi.fn().mockImplementation((fn: (err: Error) => void) => {
					fn(new Error('test'));

					return new Transform();
				}),
			}) as unknown as Sharp,
	);

	const result = await getMetadata(stream);

	expect(result).toEqual({});
});

test('Populates description, title, and tags from IPTC metadata', async () => {
	const stream = new Readable();
	stream._read = vi.fn();

	vi.mocked(getSharpInstance).mockImplementation(
		() =>
			({
				metadata: vi.fn().mockImplementation((fn: (err: null, metadata: Record<string, unknown>) => void) => {
					fn(null, {
						width: 100,
						height: 100,
						iptc: Buffer.from([
							0x1c,
							0x02,
							0x00,
							0x00,
							0x02,
							0x00,
							0x04, // IPTC record version (skipped by parser)
							0x1c,
							0x02,
							0x78,
							0x00,
							0x0c,
							...Buffer.from('Test caption'),
							0x1c,
							0x02,
							0x69,
							0x00,
							0x0d,
							...Buffer.from('Test headline'),
							0x1c,
							0x02,
							0x19,
							0x00,
							0x06,
							...Buffer.from('nature'),
							0x1c,
							0x02,
							0x19,
							0x00,
							0x06,
							...Buffer.from('travel'),
						]),
					});

					return new Transform();
				}),
			}) as unknown as Sharp,
	);

	const result = await getMetadata(stream);

	expect(result.description).toBe('Test caption');
	expect(result.title).toBe('Test headline');
	expect(result.tags).toEqual(['nature', 'travel']);
});
