import type { File, Transformation, TransformationParams } from '../types/index.js';

export function resolvePreset(input: TransformationParams, file: File): Transformation[] {
	const transforms = input.transforms ? [...input.transforms] : [];

	if (input.format || input.quality) {
		transforms.push([
			'toFormat',
			input.format || (file.type!.split('/')[1] as any),
			{
				quality: input.quality ? Number(input.quality) : undefined,
			},
		]);
	}

	if (input.width || input.height) {
		transforms.push([
			'resize',
			{
				width: input.width ? Number(input.width) : undefined,
				height: input.height ? Number(input.height) : undefined,
				fit: input.fit,
				withoutEnlargement: input.withoutEnlargement ? Boolean(input.withoutEnlargement) : undefined,
			},
		]);
	}

	return transforms;
}

/**
 * Try to extract a file format from an array of `Transformation`'s.
 */
export function maybeExtractFormat(transforms: Transformation[]): string | undefined {
	const toFormats = transforms.filter((t) => t[0] === 'toFormat');
	const lastToFormat = toFormats[toFormats.length - 1];
	return lastToFormat ? lastToFormat[1]?.toString() : undefined;
}
