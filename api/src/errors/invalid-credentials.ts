import { createError } from '@directus/errors';
import { ErrorCode } from './codes.js';

export const InvalidCredentialsError = createError(ErrorCode.InvalidCredentials, 'Invalid user credentials.', 401);
