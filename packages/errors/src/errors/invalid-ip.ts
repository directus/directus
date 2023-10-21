import { createError, ErrorCode } from '../index.js';

export const InvalidIpError = createError(ErrorCode.InvalidIp, 'Invalid IP address.', 401);
