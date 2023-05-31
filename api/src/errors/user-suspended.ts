import { createError } from '@directus/errors';

export const UserSuspendedError = createError('USER_SUSPENDED', 'User suspended.', 401);
