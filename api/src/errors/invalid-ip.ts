import { createError } from '@directus/errors';
import { ErrorCode } from './codes.js';

export const InvalidIpError = createError(ErrorCode.InvalidIp, 'Invalid IP address.', 401);
