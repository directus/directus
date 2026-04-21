import { createError } from '@directus/errors';

export const LicenseExpiredError = createError('LICENSE_EXPIRED', 'License has expired.', 403);
export const LicenseCanceledError = createError('LICENSE_CANCELED', 'License has been canceled.', 403);
