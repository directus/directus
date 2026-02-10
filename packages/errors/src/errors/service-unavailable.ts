import { createError, type DirectusErrorConstructor, ErrorCode } from '../index.js';

export interface ServiceUnavailableErrorExtensions {
	service: string;
	reason: string;
}

export const messageConstructor = ({ service, reason }: ServiceUnavailableErrorExtensions) =>
	`Service "${service}" is unavailable. ${reason}.`;

export const ServiceUnavailableError: DirectusErrorConstructor<ServiceUnavailableErrorExtensions> =
	createError<ServiceUnavailableErrorExtensions>(ErrorCode.ServiceUnavailable, messageConstructor, 503);
