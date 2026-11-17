import { createError, type DirectusErrorConstructor, ErrorCode } from '../index.js';

/**
 * Which invalid license state rejected the key.
 */
export type LicenseInvalidFailure =
	| 'verification'
	| 'expired'
	| 'canceled'
	| 'suspended'
	| 'invalid_key'
	| 'activation_limit'
	| 'binding_mismatch';

export interface LicenseInvalidErrorExtensions {
	failure: LicenseInvalidFailure;
	reason: string;
}

export const messageConstructor = ({ reason }: LicenseInvalidErrorExtensions): string =>
	`License key cannot be applied. ${reason}`;

export const LicenseInvalidError: DirectusErrorConstructor<LicenseInvalidErrorExtensions> =
	createError<LicenseInvalidErrorExtensions>(ErrorCode.LicenseInvalid, messageConstructor, 400);
