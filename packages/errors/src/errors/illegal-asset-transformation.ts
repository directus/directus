import { createError, ErrorCode } from '../index.js';

export interface IllegalAssetTransformationErrorExtensions {
	invalidTransformations: string[];
}

export const IllegalAssetTransformationError = createError<IllegalAssetTransformationErrorExtensions>(
	ErrorCode.IllegalAssetTransformation,
	'Illegal asset transformation.',
	400,
);
