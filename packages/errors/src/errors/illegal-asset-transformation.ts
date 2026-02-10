import { createError, type DirectusErrorConstructor, ErrorCode } from '../index.js';

export interface IllegalAssetTransformationErrorExtensions {
	invalidTransformations: string[];
}

export const IllegalAssetTransformationError: DirectusErrorConstructor<IllegalAssetTransformationErrorExtensions> =
	createError<IllegalAssetTransformationErrorExtensions>(
		ErrorCode.IllegalAssetTransformation,
		'Illegal asset transformation.',
		400,
	);
