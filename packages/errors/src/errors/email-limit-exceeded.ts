import ms from 'ms';
import { createError, ErrorCode } from '../index.js';

export interface EmailLimitExceededErrorExtensions {
	points?: number | undefined;
	duration?: number | undefined;
	message?: string | undefined;
}

export const messageConstructor = (extensions: EmailLimitExceededErrorExtensions) => {
	const message = ['Email sending limit exceeded.'];

	if (typeof extensions.points === 'number' && typeof extensions.duration === 'number') {
		const duration = ms(extensions.duration * 1000, { long: true });
		message.push(`Limit of ${extensions.points} emails every ${duration}.`);
	}

	if (extensions.message) {
		message.push(extensions.message);
	}

	return message.join(' ');
};

export const EmailLimitExceededError = createError<EmailLimitExceededErrorExtensions>(
	ErrorCode.EmailLimitExceeded,
	messageConstructor,
	429,
);
