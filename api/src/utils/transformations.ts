import {
	File,
	Transformation,
	TransformationParams,
	TransformationPreset,
	TransformationPresetFormat,
	TransformationPresetResize,
} from '../types';

/** Extract an array of transforms from params or a preset */
export const resolve = (input: TransformationParams | TransformationPreset, file: File): Transformation[] => {
	const transforms = input.transforms || [];

	// We don't need to do anything if this isn't a preset data structure.
	if (transforms.length === 0 || !('method' in transforms[0])) {
		return transforms as Transformation[];
	}

	return resolvePreset(input as TransformationPreset, file);
};

// Extract transforms from a preset
const resolvePreset = (input: TransformationPreset, file: File): Transformation[] => {
	// Add any additional transforms
	const additional = (input.transforms || []).reduce((transforms, presetTransform) => {
		try {
			const args = (presetTransform.arguments || []).map((arg) => JSON.parse(arg.argument));
			const transform: Transformation = [presetTransform.method, ...args] as any;
			return [...transforms, transform];
		} catch (err) {
			err.message = `Error parsing ${presetTransform.method} asset transformation: ${err.message}`;
			throw err;
		}
	}, [] as Transformation[]);

	// Do the format conversion last
	return [extractResize(input), ...additional, extractToFormat(input, file)].filter(
		(transform): transform is Transformation => transform !== undefined
	);
};

// For filtering out falsey (except `false`) values
const validOptionValue = (val: any) => ![null, undefined, ''].includes(val);

const extractOptions =
	<T extends Record<string, any>>(keys: (keyof T)[], numberKeys: (keyof T)[] = []) =>
	(input: TransformationPreset): T =>
		Object.entries(input).reduce(
			(config, [key, value]) =>
				keys.includes(key as any) && validOptionValue(value)
					? {
							...config,
							[key]: numberKeys.includes(key as any) ? +value : value,
					  }
					: config,
			{} as T
		);

// Extract format transform from a preset
const extractToFormat = (input: TransformationPreset, file: File): Transformation | undefined => {
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
};

const extractResize = (input: TransformationPreset): Transformation | undefined => {
	const resizable = ['width', 'height'].some((key) => key in input);
	if (!resizable) return undefined;

	return [
		'resize',
		extractOptions<TransformationPresetResize>(
			['width', 'height', 'fit', 'withoutEnlargement'],
			['width', 'height']
		)(input),
	];
};

/**
 * Try to extract a file format from an array of `Transformation`'s.
 */
export const maybeExtractFormat = (transforms: Transformation[]): string | undefined => {
	const toFormats = transforms.filter((t) => t[0] === 'toFormat');
	const lastToFormat = toFormats[toFormats.length - 1];
	return lastToFormat ? lastToFormat[1]?.toString() : undefined;
};
