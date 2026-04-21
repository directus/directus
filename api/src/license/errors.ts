import { createError } from '@directus/errors';
import { LICENSE_CHANGE_BLOCKED } from './constants.js';
import type { LicenseDeactivationAssessment } from './types.js';

export const PROJECT_LOCKED_REASON = 'PROJECT_LOCKED';

export const ProjectLockedError = createError(
	PROJECT_LOCKED_REASON,
	'Project is locked due to license suspension.',
	403,
);

export const BindingMismatchError = createError(
	'BINDING_MISMATCH',
	'Submitted binding does not match the stored license state.',
	409,
);

export const LicenseBoundError = createError('LICENSE_BOUND', 'License is already bound to another project.', 409);
export const LicenseExpiredError = createError('LICENSE_EXPIRED', 'License has expired.', 403);
export const LicenseCanceledError = createError('LICENSE_CANCELED', 'License has been canceled.', 403);

export const SubscriptionPastDueError = createError<Record<string, unknown>>(
	'SUBSCRIPTION_PAST_DUE',
	'Billing mutation is blocked until the payment issue is resolved.',
	403,
);

export const AddonNotAllowedError = createError(
	'ADDON_NOT_ALLOWED',
	'Addon is not available for the current license plan.',
	403,
);

export const NoPaymentMethodError = createError<Record<string, unknown>>(
	'NO_PAYMENT_METHOD',
	'A payment method is required before this billing change can be completed.',
	402,
);

export const BillingLinkageMissingError = createError<Record<string, unknown>>(
	'BILLING_LINKAGE_MISSING',
	'Self-service plan license is missing Stripe billing linkage.',
	409,
);

export const SeatOverflowError = createError<Record<string, unknown>>(
	'SEAT_OVERFLOW',
	'The requested downgrade would leave too few seats for the current project.',
	409,
);

export const LicenseChangeBlockedError = createError<{ assessment: LicenseDeactivationAssessment }>(
	LICENSE_CHANGE_BLOCKED,
	'Project does not comply with the proposed license.',
	409,
);
