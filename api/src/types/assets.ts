import type { ResizeOptions, Sharp } from 'sharp';

// List of allowed sharp methods to expose.
//
// This is a literal, so we can use it to validate request parameters.
export const TransformationMethods /*: readonly (keyof Sharp)[]*/ = [
	// Output options
	// https://sharp.pixelplumbing.com/api-output
	'toFormat',
	'jpeg',
	'png',
	'tiff',
	'webp',

	// Resizing
	// https://sharp.pixelplumbing.com/api-resize
	'resize',
	'extend',
	'extract',
	'trim',

	// Image operations
	// https://sharp.pixelplumbing.com/api-operation
	'rotate',
	'flip',
	'flop',
	'sharpen',
	'median',
	'blur',
	'flatten',
	'gamma',
	'negate',
	'normalise',
	'normalize',
	'clahe',
	'convolve',
	'threshold',
	'linear',
	'recomb',
	'modulate',

	// Color manipulation
	// https://sharp.pixelplumbing.com/api-colour
	'tint',
	'greyscale',
	'grayscale',
	'toColorspace',
	'toColourspace',

	// Channel manipulation
	// https://sharp.pixelplumbing.com/api-channel
	'removeAlpha',
	'ensureAlpha',
	'extractChannel',
	'bandbool',
] as const;

// Helper types
type AllowedSharpMethods = Pick<Sharp, (typeof TransformationMethods)[number]>;

export type TransformationMap = {
	[M in keyof AllowedSharpMethods]: readonly [M, ...Parameters<AllowedSharpMethods[M]>];
};

export type Transformation = TransformationMap[keyof TransformationMap];

export type TransformationParams = {
	key?: string;
	transforms?: Transformation[];
};

// Transformation preset is defined in the admin UI.
export type TransformationPreset = TransformationPresetFormat &
	TransformationPresetResize &
	TransformationParams & { key: string };

export type TransformationPresetFormat = {
	format?: 'jpg' | 'jpeg' | 'png' | 'webp' | 'tiff';
	quality?: number;
};

export type TransformationPresetResize = Pick<ResizeOptions, 'width' | 'height' | 'fit' | 'withoutEnlargement'>;

// @NOTE Keys used in TransformationParams should match ASSET_GENERATION_QUERY_KEYS in constants.ts
