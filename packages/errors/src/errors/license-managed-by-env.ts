import { createError, type DirectusErrorConstructor, ErrorCode } from '../index.js';

export const messageConstructor = (): string =>
	`The license is managed via the environment and cannot be modified from the UI.`;

export const LicenseManagedByEnvError: DirectusErrorConstructor = createError(
	ErrorCode.LicenseManagedByEnv,
	messageConstructor,
	409,
);
