import { createError, type DirectusErrorConstructor, ErrorCode } from '../index.js';

export interface InvalidLicenseTokenErrorExtensions {
	reason?: string;
}

export const messageConstructor = ({ reason }: InvalidLicenseTokenErrorExtensions): string =>
	reason ? `Invalid license token. ${reason}.` : 'Invalid license token.';

export const InvalidLicenseTokenError: DirectusErrorConstructor<InvalidLicenseTokenErrorExtensions> =
	createError<InvalidLicenseTokenErrorExtensions>(ErrorCode.InvalidLicenseToken, messageConstructor, 400);
