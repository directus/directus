import type { TransformationResize } from '@directus/types';
import { clamp } from 'lodash-es';

type Dimensions = { w: number; h: number };
type FocalPoint = { x: number; y: number };
type Region = { left: number; top: number; width: number; height: number };

// Loose enough to take both query transformation params and stored storage asset presets
type ResizeParams = {
	[K in keyof TransformationResize]?: TransformationResize[K] | null;
};

/**
 * Resize an image but keep it centered on the focal point.
 * Based on the method outlined in https://github.com/lovell/sharp/issues/1198#issuecomment-384591756
 */
export function getFocalPointResize(
	original: Dimensions,
	target: Dimensions,
	focalPoint?: FocalPoint | null,
): { width: number; height: number; region: Region } {
	const { width, height, factor } = getIntermediateDimensions(original, target);

	const region = getExtractionRegion(factor, focalPoint ?? { x: original.w / 2, y: original.h / 2 }, target, {
		w: width,
		h: height,
	});

	return { width, height, region };
}

/**
 * The area of the original image a preset keeps when it crops around the focal point, in original image pixels.
 * Returns `null` when the preset doesn't crop around the focal point: it doesn't `cover`, doesn't set both dimensions,
 * or its aspect ratio already matches the image.
 */
export function getFocalPointCrop(
	original: Dimensions,
	focalPoint: FocalPoint | null | undefined,
	{ width, height, fit, withoutEnlargement }: ResizeParams,
): Region | null {
	if (fit !== undefined && fit !== 'cover') return null;
	if (!width || !height) return null;

	const target = {
		w: withoutEnlargement ? Math.min(Number(width), original.w) : Number(width),
		h: withoutEnlargement ? Math.min(Number(height), original.h) : Number(height),
	};

	const { width: resizedWidth, height: resizedHeight, factor } = getIntermediateDimensions(original, target);

	if (resizedWidth === target.w && resizedHeight === target.h) return null;

	const region = getExtractionRegion(factor, focalPoint ?? { x: original.w / 2, y: original.h / 2 }, target, {
		w: resizedWidth,
		h: resizedHeight,
	});

	// Scale back to the original image, keeping rounding from pushing the area past its edges
	const cropWidth = Math.min(Math.round(region.width * factor), original.w);
	const cropHeight = Math.min(Math.round(region.height * factor), original.h);

	return {
		left: Math.min(Math.round(region.left * factor), original.w - cropWidth),
		top: Math.min(Math.round(region.top * factor), original.h - cropHeight),
		width: cropWidth,
		height: cropHeight,
	};
}

/**
 * Calculates the dimensions of the intermediate (resized) image.
 */
function getIntermediateDimensions(
	original: Dimensions,
	target: Dimensions,
): { width: number; height: number; factor: number } {
	const hRatio = original.h / target.h;
	const wRatio = original.w / target.w;

	let factor: number;
	let width: number;
	let height: number;

	if (hRatio < wRatio) {
		factor = hRatio;
		height = Math.round(target.h);
		width = Math.round(original.w / factor);
	} else {
		factor = wRatio;
		width = Math.round(target.w);
		height = Math.round(original.h / factor);
	}

	return { width, height, factor };
}

/**
 * Calculates the Region to extract from the intermediate image.
 */
function getExtractionRegion(
	factor: number,
	focalPoint: FocalPoint,
	target: Dimensions,
	intermediate: Dimensions,
): Region {
	const newXCenter = focalPoint.x / factor;
	const newYCenter = focalPoint.y / factor;

	return {
		left: clamp(Math.round(newXCenter - target.w / 2), 0, intermediate.w - target.w),
		top: clamp(Math.round(newYCenter - target.h / 2), 0, intermediate.h - target.h),
		width: target.w,
		height: target.h,
	};
}
