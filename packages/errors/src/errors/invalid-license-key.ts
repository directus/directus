import { createError, type DirectusErrorConstructor, ErrorCode } from '../index.js';

export interface InvalidLicenseKeyErrorExtensions {
	reason?: string;
}

export const messageConstructor = ({ reason }: InvalidLicenseKeyErrorExtensions): string =>
	reason ? `Invalid license key. ${reason}.` : 'Invalid license key.';

export const InvalidLicenseKeyError: DirectusErrorConstructor<InvalidLicenseKeyErrorExtensions> =
	createError<InvalidLicenseKeyErrorExtensions>(ErrorCode.InvalidLicenseKey, messageConstructor, 400);
