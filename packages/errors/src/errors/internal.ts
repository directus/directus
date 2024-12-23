import { createError, ErrorCode } from '../index.js';

export const InternalServerError = createError(ErrorCode.Internal, `An unexpected error occurred.`);
