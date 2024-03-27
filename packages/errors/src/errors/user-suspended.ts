import { createError, ErrorCode } from '../index.js';

export const UserSuspendedError = createError(ErrorCode.UserSuspended, 'User suspended.', 401);
