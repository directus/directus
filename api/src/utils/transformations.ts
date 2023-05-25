import type { File, Transformation, TransformationFormat, TransformationSet } from '../types/index.js';

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

	if (transformationParams.width || transformationParams.height) {
		transforms.push([
			'resize',
			{
				width: transformationParams.width ? Number(transformationParams.width) : undefined,
				height: transformationParams.height ? Number(transformationParams.height) : undefined,
				fit: transformationParams.fit,
				withoutEnlargement: transformationParams.withoutEnlargement
					? Boolean(transformationParams.withoutEnlargement)
					: undefined,
			},
		]);
	}

	return transforms;
}

function getFormat(
	file: File,
	format: TransformationSet['transformationParams']['format'],
	acceptFormat: TransformationSet['acceptFormat']
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
