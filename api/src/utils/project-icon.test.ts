import sharp from 'sharp';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import getDatabase from '../database/index.js';
import { faviconHandler } from './project-icon.js';

vi.mock('../database/index.js');

function mockColor(color: string | null) {
	const first = vi.fn().mockResolvedValue({ project_color: color });
	vi.mocked(getDatabase).mockReturnValue({ select: () => ({ from: () => ({ first }) }) } as any);
}

async function requestFavicon() {
	const res = { set: vi.fn(), send: vi.fn() };
	const next = vi.fn();

	await faviconHandler({} as any, res as any, next);

	return { res, next, png: res.send.mock.calls[0]?.[0] as Buffer };
}

async function centerPixel(png: Buffer) {
	const { data } = await sharp(png)
		.extract({ left: 10, top: 32, width: 1, height: 1 })
		.raw()
		.toBuffer({ resolveWithObject: true });

	return [...data.subarray(0, 3)];
}

describe('faviconHandler', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test('serves a 64px PNG in the project color', async () => {
		mockColor('#E35169');

		const { res, png } = await requestFavicon();

		expect(res.set).toHaveBeenCalledWith('Content-Type', 'image/png');
		expect(await sharp(png).metadata()).toMatchObject({ format: 'png', width: 64, height: 64 });
		expect(await centerPixel(png)).toEqual([0xe3, 0x51, 0x69]);
	});

	test('falls back to Directus purple without a valid project color', async () => {
		mockColor('#FFF" onload="alert(1)');

		const { png } = await requestFavicon();

		expect(await centerPixel(png)).toEqual([0x66, 0x44, 0xff]);
	});

	test('passes database errors on', async () => {
		vi.mocked(getDatabase).mockImplementation(() => {
			throw new Error('down');
		});

		const { next } = await requestFavicon();

		expect(next).toHaveBeenCalledWith(expect.any(Error));
	});
});
