import { isNil } from 'lodash';
import type {
	File,
	Transformation,
	TransformationParams,
	TransformationPreset,
	TransformationPresetFormat,
	TransformationPresetResize,
} from '../types';

// Extract transforms from a preset
export function resolvePreset(input: TransformationParams | TransformationPreset, file: File): Transformation[] {
	// Do the format conversion last
	return [extractResize(input), ...(input.transforms ?? []), extractToFormat(input, file)].filter(
		(transform): transform is Transformation => transform !== undefined
	);
}

function extractOptions<T extends Record<string, any>>(
	keys: (keyof T)[],
	numberKeys: (keyof T)[] = [],
	booleanKeys: (keyof T)[] = []
) {
	return function (input: TransformationParams | TransformationPreset): T {
		return Object.entries(input).reduce(
			(config, [key, value]) =>
				keys.includes(key as any) && isNil(value) === false
					? {
							...config,
							[key]: numberKeys.includes(key as any)
								? +value!
								: booleanKeys.includes(key as any)
								? Boolean(value)
								: value,
					  }
					: config,
			{} as T
		);
	};
}

// Extract format transform from a preset
function extractToFormat(input: TransformationParams | TransformationPreset, file: File): Transformation | undefined {
	const options = extractOptions<TransformationPresetFormat>(['format', 'quality'], ['quality'])(input);
	return Object.keys(options).length > 0
		? [
				'toFormat',
				options.format || (file.type!.split('/')[1] as any),
				{
					quality: options.quality,
				},
		  ]
		: undefined;
}

function extractResize(input: TransformationParams | TransformationPreset): Transformation | undefined {
	const resizable = ['width', 'height'].some((key) => key in input);
	if (!resizable) return undefined;

	return [
		'resize',
		extractOptions<TransformationPresetResize>(
			['width', 'height', 'fit', 'withoutEnlargement'],
			['width', 'height'],
			['withoutEnlargement']
		)(input),
	];
}

/**
 * Try to extract a file format from an array of `Transformation`'s.
 */
export function maybeExtractFormat(transforms: Transformation[]): string | undefined {
	const toFormats = transforms.filter((t) => t[0] === 'toFormat');
	const lastToFormat = toFormats[toFormats.length - 1];
	return lastToFormat ? lastToFormat[1]?.toString() : undefined;
}
