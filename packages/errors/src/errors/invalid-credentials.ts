import { createError, ErrorCode } from '../index.js';

export const InvalidCredentialsError = createError(ErrorCode.InvalidCredentials, 'Invalid user credentials.', 401);
