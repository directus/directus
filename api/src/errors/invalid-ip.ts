import { createError } from '@directus/errors';

export const InvalidIpError = createError('INVALID_IP', 'Invalid IP address.', 401);
