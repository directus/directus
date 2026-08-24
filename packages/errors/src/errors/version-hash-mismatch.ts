import { createError, type DirectusErrorConstructor, ErrorCode } from '../index.js';

export interface VersionHashMismatchErrorExtensions {
	mainHash: string;
}

const messageConstructor = () => `Main item has changed since this version was last updated.`;

export const VersionHashMismatchError: DirectusErrorConstructor<VersionHashMismatchErrorExtensions> =
	createError<VersionHashMismatchErrorExtensions>(ErrorCode.VersionHashMismatch, messageConstructor, 422);
