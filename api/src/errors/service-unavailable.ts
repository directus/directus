import { createError } from '@directus/errors';

interface ServiceUnavailableErrorExtensions {
	service: string;
	reason: string;
}

export const messageConstructor = ({ service, reason }: ServiceUnavailableErrorExtensions) =>
	`Service "${service}" is unavailable. ${reason}.`;

export const ServiceUnavailableError = createError<ServiceUnavailableErrorExtensions>(
	'SERVICE_UNAVAILABLE',
	messageConstructor,
	503
);
