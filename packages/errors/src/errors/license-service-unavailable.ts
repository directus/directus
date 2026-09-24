import { createError, type DirectusErrorConstructor, ErrorCode } from '../index.js';

export interface LicenseServiceUnavailableErrorExtensions {
	reason: string;
}

export const messageConstructor = (ext: LicenseServiceUnavailableErrorExtensions | void): string => {
	if (ext?.reason) return `Licensing service is unreachable. ${ext.reason}`;

	return `Licensing service is unreachable.`;
};

export const LicenseServiceUnavailableError: DirectusErrorConstructor<void | LicenseServiceUnavailableErrorExtensions> =
	createError(ErrorCode.LicenseServiceUnavailable, messageConstructor, 503);
