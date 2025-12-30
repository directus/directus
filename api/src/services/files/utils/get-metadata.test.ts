import { getMetadata } from './get-metadata.js';
import { getSharpInstance } from '../lib/get-sharp-instance.js';
import { Readable, Transform } from 'node:stream';
import type { Sharp } from 'sharp';
import { expect, test, vi } from 'vitest';

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
