import { createError } from '@directus/errors';
import { ErrorCode } from './codes.js';

export enum RequestTimeoutCause {
	AssetTransformation = 'ASSET_TRANSFORMATION',
}

export interface RequestTimeout {
	cause: RequestTimeoutCause;
}

export const RequestTimeoutError = createError<RequestTimeout>(ErrorCode.RequestTimeout, 'Request timed out.', 408);
