import { createError } from '@directus/errors';
import { ErrorCode } from './codes.js';

export const InvalidProviderError = createError(ErrorCode.InvalidProvider, 'Invalid provider.', 403);
