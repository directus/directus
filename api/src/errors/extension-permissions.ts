import { createError } from '@directus/errors';
import { ErrorCode } from './codes.js';

interface ExtensionServiceErrorExtensions {
	service: string;
	reason: string;
}

export const messageConstructor = ({ service, reason }: ExtensionServiceErrorExtensions) =>
	`No access to "${service}". ${reason}.`;

export const ExtensionServiceError = createError<ExtensionServiceErrorExtensions>(
	ErrorCode.ServiceUnavailable,
	messageConstructor,
	503
);
