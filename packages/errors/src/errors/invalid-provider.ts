import { createError, ErrorCode } from '../index.js';

export const InvalidProviderError = createError(ErrorCode.InvalidProvider, 'Invalid provider.', 403);
