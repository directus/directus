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
		const duration = ms(extensions.duration, { long: true });
		message.push(`Limit ${extensions.points} mails per ${duration}.`);
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
