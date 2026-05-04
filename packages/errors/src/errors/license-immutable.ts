import { createError, type DirectusErrorConstructor, ErrorCode } from '../index.js';

export interface LicenseImmutableErrorExtensions {
	action: string;
	source: string;
}

export const messageConstructor = ({ action, source }: LicenseImmutableErrorExtensions) =>
	`"${action}" is not allowed. ${source} license cannot be modified.`;

export const LicenseImmutableError: DirectusErrorConstructor<LicenseImmutableErrorExtensions> =
	createError<LicenseImmutableErrorExtensions>(ErrorCode.InvalidPayload, messageConstructor, 409);
