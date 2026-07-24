import { useEnv } from '@directus/env';
import { IllegalAssetTransformationError } from '@directus/errors';
import type { Transformation } from '@directus/types';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
	assertTransformsAllowed,
	calculateExtend,
	calculateExtract,
	calculateResize,
	calculateRotate,
	calculateStep,
	clampScale,
	scaled,
	toDimension,
} from './assert-transforms-allowed.js';

vi.mock('@directus/env', async () => {
	const { mockEnv } = await import('../../test-utils/env.js');
	return mockEnv();
});

describe('assertTransformsAllowed', () => {
	const MAX_DIM = 6000;

	beforeEach(() => {
		const env = vi.mocked(useEnv)() as Record<string, unknown>;
		env['ASSETS_TRANSFORM_IMAGE_MAX_OUTPUT_DIMENSION'] = MAX_DIM;
	});

	afterEach(() => {
		const env = vi.mocked(useEnv)() as Record<string, unknown>;
		delete env['ASSETS_TRANSFORM_IMAGE_MAX_OUTPUT_DIMENSION'];
	});

	test('When there are no transforms, then it does not throw', () => {
		expect(() => assertTransformsAllowed(1000, 1000, [])).not.toThrow();
	});

	test('When every step stays within the cap, then it does not throw', () => {
		const transforms: Transformation[] = [['resize', { width: 5000, height: 5000 }]];
		expect(() => assertTransformsAllowed(1, 1, transforms)).not.toThrow();
	});

	test('When a step lands exactly on the cap, then it does not throw', () => {
		const transforms: Transformation[] = [['resize', { width: MAX_DIM, height: MAX_DIM }]];
		expect(() => assertTransformsAllowed(1, 1, transforms)).not.toThrow();
	});

	test('When a step exceeds the cap, then it throws', () => {
		const transforms: Transformation[] = [['resize', { width: 20000, height: 20000 }]];
		expect(() => assertTransformsAllowed(1, 1, transforms)).toThrow(IllegalAssetTransformationError);
	});

	test('When an intermediate step exceeds the cap, then it throws even though a later step shrinks back under it', () => {
		const transforms: Transformation[] = [
			['resize', { width: 20000, height: 20000 }],
			['extract', { left: 0, top: 0, width: 100, height: 100 }],
		];

		expect(() => assertTransformsAllowed(1, 1, transforms)).toThrow(IllegalAssetTransformationError);
	});

	test('When a source dimension is zero, then it does not divide by zero or throw', () => {
		const transforms: Transformation[] = [['resize', { width: 100 }]];
		expect(() => assertTransformsAllowed(0, 0, transforms)).not.toThrow();
	});

	test.each([
		['undefined', undefined],
		['a non-numeric string', 'not-a-number'],
		['zero', 0],
		['a negative number', -100],
	])('When the max output dimension env var is %s, then it falls back to the default cap', (_label, value) => {
		const env = vi.mocked(useEnv)() as Record<string, unknown>;
		env['ASSETS_TRANSFORM_IMAGE_MAX_OUTPUT_DIMENSION'] = value;

		const within: Transformation[] = [['resize', { width: 3000 }]];
		expect(() => assertTransformsAllowed(1, 1, within)).not.toThrow();

		const exceeds: Transformation[] = [['resize', { width: 3001 }]];
		expect(() => assertTransformsAllowed(1, 1, exceeds)).toThrow(IllegalAssetTransformationError);
	});
});

describe('calculateStep', () => {
	test('When the method is resize, then it delegates to the resize projection', () => {
		expect(calculateStep({ width: 1, height: 1 }, 'resize', [{ width: 5000, height: 5000 }])).toEqual({
			width: 5000,
			height: 5000,
		});
	});

	test('When the method is extract, then it delegates to the extract projection', () => {
		expect(calculateStep({ width: 1000, height: 1000 }, 'extract', [{ width: 500, height: 500 }])).toEqual({
			width: 500,
			height: 500,
		});
	});

	test('When the method is extend, then it delegates to the extend projection', () => {
		expect(calculateStep({ width: 100, height: 100 }, 'extend', [50])).toEqual({ width: 200, height: 200 });
	});

	test('When the method is rotate, then it delegates to the rotate projection', () => {
		expect(calculateStep({ width: 6000, height: 1 }, 'rotate', [90])).toEqual({ width: 1, height: 6000 });
	});

	test('When the method is dimension-neutral (e.g. blur), then the size is unchanged', () => {
		expect(calculateStep({ width: 100, height: 100 }, 'blur', [5])).toEqual({ width: 100, height: 100 });
	});

	test('When the method is unknown, then the size is unchanged', () => {
		expect(calculateStep({ width: 100, height: 100 }, 'fictional', [{ width: 20000 }])).toEqual({
			width: 100,
			height: 100,
		});
	});
});

describe('calculateResize', () => {
	describe('argument forms', () => {
		test('When given an options object, then it resizes to the requested box', () => {
			expect(calculateResize({ width: 1, height: 1 }, [{ width: 5000, height: 5000 }])).toEqual({
				width: 5000,
				height: 5000,
			});
		});

		test('When given positional width and height, then it resizes to the requested box', () => {
			expect(calculateResize({ width: 1, height: 1 }, [5000, 5000])).toEqual({ width: 5000, height: 5000 });
		});

		test('When given a positional options argument, then its fit mode is honored', () => {
			expect(calculateResize({ width: 6000, height: 1 }, [10, 6000, { fit: 'outside' }])).toEqual({
				width: 36_000_000,
				height: 6000,
			});
		});

		test('When the width/height argument is an array, then it is not mistaken for an options object', () => {
			expect(calculateResize({ width: 1, height: 1 }, [[20000, 20000]])).toEqual({ width: 1, height: 1 });
		});

		test('When both axes are absent, then the input is unchanged', () => {
			expect(calculateResize({ width: 100, height: 100 }, [{ width: null, height: undefined }])).toEqual({
				width: 100,
				height: 100,
			});
		});
	});

	describe('single axis', () => {
		test('When only the width is given, then the height scales proportionally', () => {
			expect(calculateResize({ width: 6000, height: 1 }, [{ width: 6000 }])).toEqual({ width: 6000, height: 1 });
		});

		test('When only the height is given, then the width scales proportionally', () => {
			expect(calculateResize({ width: 6000, height: 1 }, [{ height: 6000 }])).toEqual({
				width: 36_000_000,
				height: 6000,
			});
		});

		test('When the source axis is zero, then the non-finite scale leaves the input unchanged', () => {
			expect(calculateResize({ width: 0, height: 0 }, [{ width: 100 }])).toEqual({ width: 0, height: 0 });
		});

		test('When dimensions are negative, then they are ignored and the input is unchanged', () => {
			expect(calculateResize({ width: 1, height: 1 }, [{ width: -1, height: -1 }])).toEqual({ width: 1, height: 1 });
		});
	});

	describe('fit modes', () => {
		test('When fit is cover (default), then the output is the requested box', () => {
			expect(calculateResize({ width: 100, height: 100 }, [{ width: 5000, height: 5000, fit: 'cover' }])).toEqual({
				width: 5000,
				height: 5000,
			});
		});

		test('When fit is contain, then the output is the requested box', () => {
			expect(calculateResize({ width: 100, height: 100 }, [{ width: 20000, height: 20000, fit: 'contain' }])).toEqual({
				width: 20000,
				height: 20000,
			});
		});

		test('When fit is inside, then the image shrinks to fit within the box', () => {
			expect(calculateResize({ width: 6000, height: 3000 }, [{ width: 1000, height: 1000, fit: 'inside' }])).toEqual({
				width: 1000,
				height: 500,
			});
		});

		test('When fit is outside, then the image scales to cover the box', () => {
			expect(calculateResize({ width: 6000, height: 1 }, [{ width: 10, height: 6000, fit: 'outside' }])).toEqual({
				width: 36_000_000,
				height: 6000,
			});
		});
	});

	describe('enlargement / reduction guards', () => {
		test('When withoutEnlargement caps a single-axis blow-up, then it stays at the source size', () => {
			expect(calculateResize({ width: 6000, height: 1 }, [{ height: 6000, withoutEnlargement: true }])).toEqual({
				width: 6000,
				height: 1,
			});
		});

		test('When withoutEnlargement caps an outside box, then it stays at the source size', () => {
			expect(
				calculateResize({ width: 100, height: 100 }, [
					{ width: 20000, height: 20000, fit: 'outside', withoutEnlargement: true },
				]),
			).toEqual({ width: 100, height: 100 });
		});

		test('When a cover box is clamped by withoutEnlargement, then the projection falls short of the box', () => {
			expect(
				calculateResize({ width: 100, height: 100 }, [
					{ width: 20000, height: 20000, fit: 'cover', withoutEnlargement: true },
				]),
			).toEqual({ width: 100, height: 100 });
		});

		test('When a cover box is floored by withoutReduction, then the projection cannot shrink below scale 1', () => {
			expect(
				calculateResize({ width: 6000, height: 6000 }, [
					{ width: 10, height: 10, fit: 'cover', withoutReduction: true },
				]),
			).toEqual({ width: 10, height: 10 });
		});

		test('When an inside box is floored by withoutReduction, then it cannot shrink past the source', () => {
			expect(
				calculateResize({ width: 6000, height: 6000 }, [
					{ width: 10, height: 10, fit: 'inside', withoutReduction: true },
				]),
			).toEqual({ width: 6000, height: 6000 });
		});
	});
});

describe('calculateExtract', () => {
	test('When the region is well-formed, then its own dimensions are returned', () => {
		expect(calculateExtract({ width: 1000, height: 1000 }, { left: 0, top: 0, width: 500, height: 500 })).toEqual({
			width: 500,
			height: 500,
		});
	});

	test('When the region is larger than the source, then the region dimensions are still returned', () => {
		expect(calculateExtract({ width: 1, height: 1 }, { width: 20000, height: 20000 })).toEqual({
			width: 20000,
			height: 20000,
		});
	});

	test('When the region is not an object, then the size is unchanged', () => {
		expect(calculateExtract({ width: 100, height: 100 }, null)).toEqual({ width: 100, height: 100 });
	});

	test('When the region is missing a dimension, then the size is unchanged', () => {
		expect(calculateExtract({ width: 100, height: 100 }, { left: 0, top: 0, width: 100 })).toEqual({
			width: 100,
			height: 100,
		});
	});
});

describe('calculateExtend', () => {
	test('When the padding is a number, then it grows every side equally', () => {
		expect(calculateExtend({ width: 100, height: 100 }, 50)).toEqual({ width: 200, height: 200 });
	});

	test('When the padding is a per-edge object, then each edge grows its axis', () => {
		expect(calculateExtend({ width: 100, height: 100 }, { top: 10, bottom: 10, left: 10, right: 10 })).toEqual({
			width: 120,
			height: 120,
		});
	});

	test('When only some edges are given, then absent edges contribute zero', () => {
		expect(calculateExtend({ width: 100, height: 100 }, { top: 10 })).toEqual({ width: 100, height: 110 });
	});

	test('When an edge is non-numeric, then it contributes zero (no NaN propagation)', () => {
		expect(calculateExtend({ width: 100, height: 100 }, { left: '10', right: 5 })).toEqual({
			width: 105,
			height: 100,
		});
	});

	test('When the padding is neither a number nor an object, then the size is unchanged', () => {
		expect(calculateExtend({ width: 100, height: 100 }, 'bogus')).toEqual({ width: 100, height: 100 });
	});
});

describe('calculateRotate', () => {
	test('When rotated 90 degrees, then the axes are swapped', () => {
		expect(calculateRotate({ width: 6000, height: 1 }, 90)).toEqual({ width: 1, height: 6000 });
	});

	test('When rotated 270 degrees, then the axes are swapped', () => {
		expect(calculateRotate({ width: 6000, height: 1 }, 270)).toEqual({ width: 1, height: 6000 });
	});

	test('When rotated by a negative angle, then it is normalized before swapping', () => {
		expect(calculateRotate({ width: 6000, height: 1 }, -90)).toEqual({ width: 1, height: 6000 });
	});

	test('When rotated 180 degrees, then the axes are unchanged', () => {
		expect(calculateRotate({ width: 6000, height: 1 }, 180)).toEqual({ width: 6000, height: 1 });
	});

	test('When the angle is not a number, then it is treated as 0 and the axes are unchanged', () => {
		expect(calculateRotate({ width: 6000, height: 1 }, 'auto')).toEqual({ width: 6000, height: 1 });
	});
});

describe('clampScale', () => {
	test('When neither guard is set, then the scale is returned unchanged', () => {
		expect(clampScale(5, false, false)).toBe(5);
	});

	test('When withoutEnlargement is set, then an upscale is capped at 1', () => {
		expect(clampScale(5, true, false)).toBe(1);
	});

	test('When withoutEnlargement is set, then a downscale is left untouched', () => {
		expect(clampScale(0.5, true, false)).toBe(0.5);
	});

	test('When withoutReduction is set, then a downscale is floored at 1', () => {
		expect(clampScale(0.5, false, true)).toBe(1);
	});

	test('When withoutReduction is set, then an upscale is left untouched', () => {
		expect(clampScale(5, false, true)).toBe(5);
	});
});

describe('scaled', () => {
	test('When the scale is finite, then both axes are scaled and rounded', () => {
		expect(scaled({ width: 100, height: 50 }, 2)).toEqual({ width: 200, height: 100 });
	});

	test('When the scaled axis is fractional, then it is rounded to the nearest pixel', () => {
		expect(scaled({ width: 3, height: 3 }, 0.5)).toEqual({ width: 2, height: 2 });
	});

	test('When the scale is non-finite, then the input is returned unchanged', () => {
		expect(scaled({ width: 100, height: 100 }, Infinity)).toEqual({ width: 100, height: 100 });
		expect(scaled({ width: 100, height: 100 }, NaN)).toEqual({ width: 100, height: 100 });
	});
});

describe('toDimension', () => {
	test('When the value is a positive safe integer, then it is returned', () => {
		expect(toDimension(500)).toBe(500);
	});

	test('When the value is zero, then it is treated as absent', () => {
		expect(toDimension(0)).toBeUndefined();
	});

	test('When the value is negative, then it is treated as absent', () => {
		expect(toDimension(-1)).toBeUndefined();
	});

	test('When the value is NaN, then it is treated as absent', () => {
		expect(toDimension(NaN)).toBeUndefined();
	});

	test('When the value is a non-integer, then it is treated as absent', () => {
		expect(toDimension(1.5)).toBeUndefined();
	});

	test('When the value exceeds the safe integer range, then it is treated as absent', () => {
		expect(toDimension(Number.MAX_SAFE_INTEGER + 1)).toBeUndefined();
	});

	test('When the value is not a number, then it is treated as absent', () => {
		expect(toDimension('500')).toBeUndefined();
	});
});
