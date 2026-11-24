import { describe, expect, it } from 'vitest';
import { getFocalPointCrop, getFocalPointResize } from './get-focal-point-crop.js';

const landscape = { w: 3000, h: 2000 };
const portrait = { w: 2000, h: 3000 };
const center = { x: 1500, y: 1000 };

describe('getFocalPointCrop', () => {
	it.each(['contain', 'inside', 'outside', 'fill'] as const)('returns null when fit is %s', (fit) => {
		expect(getFocalPointCrop(landscape, center, { width: 400, height: 400, fit })).toBeNull();
	});

	it('returns null when fit is null, matching the API', () => {
		expect(getFocalPointCrop(landscape, center, { width: 400, height: 400, fit: null })).toBeNull();
	});

	it.each([
		{ width: 400, height: null },
		{ width: 400, height: undefined },
		{ width: undefined, height: 400 },
		{ width: undefined, height: undefined },
	])('returns null without both dimensions: %o', (params) => {
		expect(getFocalPointCrop(landscape, center, params)).toBeNull();
	});

	it('returns null when the preset matches the image aspect ratio', () => {
		expect(getFocalPointCrop(landscape, center, { width: 1500, height: 1000 })).toBeNull();
	});

	it.each([undefined, 'cover'] as const)('crops when fit is %s', (fit) => {
		expect(getFocalPointCrop(landscape, center, { width: 400, height: 400, fit })).toEqual({
			left: 500,
			top: 0,
			width: 2000,
			height: 2000,
		});
	});

	it('crops around the centre without a focal point', () => {
		expect(getFocalPointCrop(landscape, null, { width: 400, height: 400 })).toEqual({
			left: 500,
			top: 0,
			width: 2000,
			height: 2000,
		});
	});

	it.each([
		{ focalPoint: { x: 100, y: 1000 }, left: 0 },
		{ focalPoint: { x: 2900, y: 1000 }, left: 1000 },
		{ focalPoint: { x: -999, y: -999 }, left: 0 },
		{ focalPoint: { x: 9999, y: 9999 }, left: 1000 },
	])('keeps the crop inside the image horizontally for $focalPoint', ({ focalPoint, left }) => {
		expect(getFocalPointCrop(landscape, focalPoint, { width: 400, height: 400 })).toEqual({
			left,
			top: 0,
			width: 2000,
			height: 2000,
		});
	});

	it.each([
		{ y: 0, top: 0 },
		{ y: 2000, top: 312 },
	])('keeps the crop inside the image vertically for y $y', ({ y, top }) => {
		expect(getFocalPointCrop(landscape, { x: 1500, y }, { width: 1600, height: 900 })).toEqual({
			left: 0,
			top,
			width: 3000,
			height: 1688,
		});
	});

	it('crops a portrait preset from a landscape image', () => {
		expect(getFocalPointCrop(landscape, center, { width: 600, height: 900 })).toEqual({
			left: 833,
			top: 0,
			width: 1333,
			height: 2000,
		});
	});

	it('crops a landscape preset from a portrait image', () => {
		expect(getFocalPointCrop(portrait, { x: 1000, y: 1500 }, { width: 1600, height: 900 })).toEqual({
			left: 0,
			top: 938,
			width: 2000,
			height: 1125,
		});
	});

	it('crops a preset larger than the image', () => {
		expect(getFocalPointCrop(landscape, center, { width: 4000, height: 4000 })).toEqual({
			left: 500,
			top: 0,
			width: 2000,
			height: 2000,
		});
	});

	it('returns null when withoutEnlargement caps the preset to the image aspect ratio', () => {
		expect(getFocalPointCrop(landscape, center, { width: 4000, height: 4000, withoutEnlargement: true })).toBeNull();
	});

	it('crops using the dimensions capped by withoutEnlargement', () => {
		expect(getFocalPointCrop(landscape, center, { width: 4000, height: 1000, withoutEnlargement: true })).toEqual({
			left: 0,
			top: 500,
			width: 3000,
			height: 1000,
		});
	});
});

describe('getFocalPointResize', () => {
	it('resizes to cover the target and extracts around the focal point', () => {
		expect(getFocalPointResize(landscape, { w: 400, h: 400 }, { x: 2900, y: 1000 })).toEqual({
			width: 600,
			height: 400,
			region: { left: 200, top: 0, width: 400, height: 400 },
		});
	});
});
