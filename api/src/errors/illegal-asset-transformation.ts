import { createError } from '@directus/errors';

export interface IllegalAssetTransformationErrorExtensions {
	invalidTransformations: string[];
}

export const IllegalAssetTransformationError = createError<IllegalAssetTransformationErrorExtensions>(
	'ILLEGAL_ASSET_TRANSFORMATION',
	'Illegal asset transformation.',
	400
);
