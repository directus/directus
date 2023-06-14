import { createError } from '@directus/errors';
import { ErrorCode } from './codes.js';

export interface IllegalAssetTransformationErrorExtensions {
	invalidTransformations: string[];
}

export const IllegalAssetTransformationError = createError<IllegalAssetTransformationErrorExtensions>(
	ErrorCode.IllegalAssetTransformation,
	'Illegal asset transformation.',
	400
);
