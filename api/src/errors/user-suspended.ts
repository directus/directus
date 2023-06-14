import { createError } from '@directus/errors';
import { ErrorCode } from './codes.js';

export const UserSuspendedError = createError(ErrorCode.UserSuspended, 'User suspended.', 401);
