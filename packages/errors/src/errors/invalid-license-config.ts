import { createError, type DirectusErrorConstructor, ErrorCode } from '../index.js';

export interface InvalidLicenseConfigErrorExtensions {
	reason: string;
}

export const messageConstructor = ({ reason }: InvalidLicenseConfigErrorExtensions): string =>
	`Missing or invalid license configuration. ${reason}.`;

export const InvalidLicenseConfigError: DirectusErrorConstructor<InvalidLicenseConfigErrorExtensions> =
	createError<InvalidLicenseConfigErrorExtensions>(ErrorCode.InvalidLicenseConfig, messageConstructor, 500);
