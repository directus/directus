import type { File, FocalPoint } from '@directus/types';
import { clamp } from 'lodash-es';
import type { Region } from 'sharp';
import type { Transformation, TransformationFormat, TransformationSet } from '../types/index.js';

export function resolvePreset({ transformationParams, acceptFormat }: TransformationSet, file: File): Transformation[] {
	const transforms = transformationParams.transforms ? [...transformationParams.transforms] : [];

	if (transformationParams.format || transformationParams.quality) {
		transforms.push([
			'toFormat',
			getFormat(file, transformationParams.format, acceptFormat),
			{
				quality: transformationParams.quality ? Number(transformationParams.quality) : undefined,
			},
		]);
	}

	if ((transformationParams.width || transformationParams.height) && file.width && file.height) {
		const toWidth = transformationParams.width ? Number(transformationParams.width) : file.width;
		const toHeight = transformationParams.height ? Number(transformationParams.height) : file.height;

		const transformArgs = getResizeArguments(
			{ w: file.width, h: file.height },
			{ w: toWidth, h: toHeight },
			file.focal_point,
		);

		transforms.push(
			[
				'resize',
				{
					width: transformArgs.width,
					height: transformArgs.height,
					fit: transformationParams.fit,
					withoutEnlargement: transformationParams.withoutEnlargement
						? Boolean(transformationParams.withoutEnlargement)
						: undefined,
				},
			],
			['extract', transformArgs.region],
		);
	}

	return transforms;
}

function getFormat(
	file: File,
	format: TransformationSet['transformationParams']['format'],
	acceptFormat: TransformationSet['acceptFormat'],
): TransformationFormat {
	const fileType = file.type?.split('/')[1] as TransformationFormat | undefined;

	if (format) {
		if (format !== 'auto') {
			return format;
		}

		if (acceptFormat) {
			return acceptFormat;
		}

		if (fileType && ['avif', 'webp', 'tiff'].includes(fileType)) {
			return 'png';
		}
	}

	return fileType || 'jpg';
}

/**
 * Try to extract a file format from an array of `Transformation`'s.
 */
export function maybeExtractFormat(transforms: Transformation[]): string | undefined {
	const toFormats = transforms.filter((t) => t[0] === 'toFormat');
	const lastToFormat = toFormats[toFormats.length - 1];
	return lastToFormat ? lastToFormat[1]?.toString() : undefined;
}

type Dimensions = { w: number; h: number };

/**
 * Resize an image but keep it centered on the focal point.
 * Based on the method outlined in https://github.com/lovell/sharp/issues/1198#issuecomment-384591756
 */
function getResizeArguments(
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

	const region: Region = {
		left: 0,
		top: 0,
		width: target.w,
		height: target.h,
	};

	if (intermediate.h < intermediate.w) {
		region.left = clamp(Math.round(newXCenter - target.w / 2), 0, intermediate.w - target.w);
	} else {
		region.top = clamp(Math.round(newYCenter - target.h / 2), 0, intermediate.h - target.h);
	}

	return region;
}
