import { useEnv } from '@directus/env';
import { IllegalAssetTransformationError } from '@directus/errors';
import type { Transformation } from '@directus/types';
import { isObject } from '@directus/utils';
import { isNumber, isString } from 'lodash-es';

export type Size = { width: number; height: number };

/**
 * Projects the running size through one sharp transform step.
 *
 * Calculates size for resize, extract, extend and rotate. Excluding trim, all other operations are no op for dimension.
 * Trim will only ever crop borders, so leaving as is keeps it within upper bound
 *
 * @param size - Dimensions entering the step
 * @param method - Sharp transform name
 * @param args - The transform's positional arguments
 * @returns upper bound for the given step
 */
export function calculateStep(size: Size, method: string, args: unknown[]): Size {
	switch (method) {
		case 'resize':
			return calculateResize(size, args);
		case 'extract':
			return calculateExtract(size, args[0]);
		case 'extend':
			return calculateExtend(size, args[0]);
		case 'rotate':
			return calculateRotate(size, args[0]);
		default:
			return size;
	}
}

/**
 * Rejects a transform if its projected output exceeds the `ASSETS_TRANSFORM_IMAGE_MAX_OUTPUT_DIMENSION`
 * limit at any stage of the transformation pipeline.
 *
 * Validating only the final dimensions is not sufficient, since intermediate transformations are fully applied before subsequent steps.
 * For example, an image scaled up to 10,000 pixels and then reduced to 5,000 pixels would end within the limit, but would still exceed
 * the allowed dimension during processing.
 *
 * @param sourceWidth - Original image width
 * @param sourceHeight - Original image height
 * @param transforms - Ordered sharp transform steps to project
 * @throws IllegalAssetTransformationError when any steps projected size exceeds the cap
 */
export function assertTransformsAllowed(sourceWidth: number, sourceHeight: number, transforms: Transformation[]): void {
	const env = useEnv();

	const maxOutputDimension = toDimension(env['ASSETS_TRANSFORM_IMAGE_MAX_OUTPUT_DIMENSION']) ?? 3000;

	let size: Size = { width: sourceWidth, height: sourceHeight };

	for (const [method, ...args] of transforms) {
		size = calculateStep(size, method, args);

		if (size.width > maxOutputDimension || size.height > maxOutputDimension) {
			throw new IllegalAssetTransformationError({ invalidTransformations: ['width', 'height'] });
		}
	}
}

/**
 * Calculates the output dimensions of a resize. Sharp supports both `resize({ width, height, fit, ... })`
 * and `resize(width, height, options?)`; the result depends on the `fit` mode and enlargement/reduction guards.
 *
 * @param input - Dimensions entering the resize
 * @param args - Sharp `resize` arguments (an options object, or positional width/height/options)
 * @returns Projected output dimensions
 */
export function calculateResize(input: Size, args: unknown[]): Size {
	let opts: Record<string, unknown> = {};
	let widthArg: unknown;
	let heightArg: unknown;

	if (isObject(args[0])) {
		opts = args[0];
		widthArg = opts['width'];
		heightArg = opts['height'];
	} else {
		widthArg = args[0];
		heightArg = args[1];

		if (isObject(args[2])) {
			opts = args[2];
		}
	}

	const width = toDimension(widthArg);
	const height = toDimension(heightArg);
	if (width === undefined && height === undefined) return input;

	const fit = isString(opts['fit']) ? opts['fit'] : 'cover';
	const withoutEnlargement = opts['withoutEnlargement'] === true;
	const withoutReduction = opts['withoutReduction'] === true;
	const clamp = (scale: number) => clampScale(scale, withoutEnlargement, withoutReduction);

	// Single axis: sharp scales uniformly off the provided axis, ignoring `fit`.
	if (width === undefined || height === undefined) {
		return scaled(input, clamp(width !== undefined ? width / input.width : height! / input.height));
	}

	// `inside` fits within the box, `outside` covers it — both keep aspect ratio.
	if (fit === 'inside') {
		return scaled(input, clamp(Math.min(width / input.width, height / input.height)));
	}

	if (fit === 'outside') {
		return scaled(input, clamp(Math.max(width / input.width, height / input.height)));
	}

	// cover (default), contain, and fill target the requested box unless
	// limited by an enlargement guard. When clamped, cover may fall short,
	// while contain and fill always pad or stretch to the full box.
	if (fit === 'cover' && (withoutEnlargement || withoutReduction)) {
		const scale = clamp(Math.max(width / input.width, height / input.height));

		return {
			width: Math.min(width, Math.round(input.width * scale)),
			height: Math.min(height, Math.round(input.height * scale)),
		};
	}

	return { width, height };
}

/**
 * Projected dimensions of an extract (crop): the region's own dimensions.
 *
 * @param size - Dimensions entering the step
 * @param region - Sharp extract region
 * @returns The region size, or `size` unchanged when the region is malformed (sharp rejects it later)
 */
export function calculateExtract(size: Size, region: unknown): Size {
	if (!isObject(region)) return size;
	const width = toDimension(region['width']);
	const height = toDimension(region['height']);
	// Skip malformed regions; never propagate undefined into the cap math.
	return width !== undefined && height !== undefined ? { width, height } : size;
}

/**
 * Projected dimensions of an extend (padding): a number pads all four sides equally, an object pads
 * each named edge.
 *
 * @param size - Dimensions entering the step
 * @param ext - Padding amount (number) or per-edge object
 * @returns Dimensions grown by the padding
 */
export function calculateExtend(size: Size, ext: unknown): Size {
	if (isNumber(ext)) return { width: size.width + ext * 2, height: size.height + ext * 2 };
	if (!isObject(ext)) return size;

	return {
		width: size.width + (toDimension(ext['left']) ?? 0) + (toDimension(ext['right']) ?? 0),
		height: size.height + (toDimension(ext['top']) ?? 0) + (toDimension(ext['bottom']) ?? 0),
	};
}

/**
 * Projected dimensions of a rotate: 90/270 swap the axes, 0/180 leave them unchanged. Arbitrary angles
 * grow to an unmodelled bounding box — a safe under-estimate, since surrounding dims are already capped.
 *
 * @param size - Dimensions entering the step
 * @param angle - Rotation in degrees; non-numbers are treated as 0
 * @returns Projected dimensions after the rotation
 */
export function calculateRotate(size: Size, angle: unknown): Size {
	const norm = (((typeof angle === 'number' ? angle : 0) % 360) + 360) % 360;
	return norm === 90 || norm === 270 ? { width: size.height, height: size.width } : size;
}

/**
 * Applies the enlargement/reduction guards to a proposed scale factor.
 *
 * @param scale - Proposed uniform scale
 * @param withoutEnlargement - Cap the scale at 1 (never upscale)
 * @param withoutReduction - Floor the scale at 1 (never downscale)
 * @returns The guarded scale
 */
export function clampScale(scale: number, withoutEnlargement: boolean, withoutReduction: boolean): number {
	if (withoutEnlargement) return Math.min(scale, 1);
	if (withoutReduction) return Math.max(scale, 1);
	return scale;
}

/**
 * Applies a uniform scale to both axes, guarding against non-finite ratios (e.g. divide-by-zero).
 *
 * @param input - Dimensions to scale
 * @param scale - Uniform scale factor
 * @returns Scaled dimensions, or `input` unchanged when the scale is non-finite
 */
export function scaled(input: Size, scale: number): Size {
	if (!Number.isFinite(scale)) return input;
	return { width: Math.round(input.width * scale), height: Math.round(input.height * scale) };
}

/**
 * Coerces a value to a usable pixel dimension (i.e. a positive safe integer).
 *
 * @param value - Candidate dimension
 * @returns The dimension, or undefined when absent/invalid (0, negative, NaN, non-number)
 */
export function toDimension(value: unknown): number | undefined {
	return isNumber(value) && Number.isSafeInteger(value) && value > 0 ? value : undefined;
}
