import type { File, Transformation, TransformationFormat, TransformationSet } from '@directus/types';
import { getFocalPointResize } from '@directus/utils';

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
		let toWidth = transformationParams.width ? Number(transformationParams.width) : undefined;
		let toHeight = transformationParams.height ? Number(transformationParams.height) : undefined;

		/*
		 * When withoutEnlargement is true, clamp target dimensions to original dimensions to prevent "bad extract area" errors when using focal points.
		 */
		if (transformationParams.withoutEnlargement) {
			if (toWidth !== undefined) {
				toWidth = Math.min(toWidth, file.width);
			}

			if (toHeight !== undefined) {
				toHeight = Math.min(toHeight, file.height);
			}
		}

		const toFocalPointX = transformationParams.focal_point_x
			? Number(transformationParams.focal_point_x)
			: file.focal_point_x;

		const toFocalPointY = transformationParams.focal_point_y
			? Number(transformationParams.focal_point_y)
			: file.focal_point_y;

		/*
		 * Focal point cropping only works with a fixed size (width x height) when `cover`ing,
		 * since the other modes show the whole image. Sharp by default also simply scales up/down
		 * when only supplied with one dimension, so we **must** check, else we break existing behaviour.
		 * See: https://sharp.pixelplumbing.com/api-resize#resize
		 * Also only crop to focal point when explicitly defined so that users can still `cover` with
		 * other parameters like `position` and `gravity` - Else fall back to regular behaviour
		 */
		if (
			(transformationParams.fit === undefined || transformationParams.fit === 'cover') &&
			toWidth &&
			toHeight &&
			toFocalPointX !== null &&
			toFocalPointY !== null
		) {
			const transformArgs = getFocalPointResize(
				{ w: file.width, h: file.height },
				{ w: toWidth, h: toHeight },
				{ x: toFocalPointX, y: toFocalPointY },
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
		} else {
			transforms.push([
				'resize',
				{
					width: toWidth,
					height: toHeight,
					fit: transformationParams.fit,
					withoutEnlargement: transformationParams.withoutEnlargement
						? Boolean(transformationParams.withoutEnlargement)
						: undefined,
				},
			]);
		}
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
