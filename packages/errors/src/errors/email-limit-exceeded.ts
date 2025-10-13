import ms from 'ms';
import { createError, ErrorCode } from '../index.js';

export interface EmailLimitExceededErrorExtensions {
	points?: number;
	duration?: number;
	message?: string;
}

export const messageConstructor = (extensions: EmailLimitExceededErrorExtensions) => {
	if (extensions.message) {
		return extensions.message;
	}

	if ('points' in extensions && 'duration' in extensions) {
		const duration = ms(extensions.duration, { long: true });
		return `Email sending limit exceeded. Limit ${extensions.points} mails per ${duration}.`;
	}

	return `Email sending limit exceeded.`;
};

export const EmailLimitExceededError = createError<EmailLimitExceededErrorExtensions>(
	ErrorCode.EmailLimitExceeded,
	messageConstructor,
	429,
);
