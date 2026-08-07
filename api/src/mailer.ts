import { createRequire } from 'node:module';
import { useEnv } from '@directus/env';
import type { Transporter } from 'nodemailer';
import nodemailer from 'nodemailer';
import type { Logger } from 'pino';
import { useLogger } from './logger/index.js';
import { getConfigFromEnv } from './utils/get-config-from-env.js';

const require = createRequire(import.meta.url);

let transporter: Transporter;

export default function getMailer(): Transporter {
	if (transporter) return transporter;

	const env = useEnv();
	const logger = useLogger();

	const transportName = (env['EMAIL_TRANSPORT'] as string).toLowerCase();

	if (transportName === 'sendmail') {
		transporter = nodemailer.createTransport({
			sendmail: true,
			newline: (env['EMAIL_SENDMAIL_NEW_LINE'] as string) || 'unix',
			path: (env['EMAIL_SENDMAIL_PATH'] as string) || '/usr/sbin/sendmail',
		});
	} else if (transportName === 'ses') {
		const { SESv2Client, SendEmailCommand } = require('@aws-sdk/client-sesv2');

		const sesOptions: Record<string, unknown> = getConfigFromEnv('EMAIL_SES_');

		const sesClient = new SESv2Client(sesOptions);

		transporter = nodemailer.createTransport({
			SES: { sesClient, SendEmailCommand },
		} as Record<string, unknown>);
	} else if (transportName === 'smtp') {
		let auth: boolean | { user?: string; pass?: string } = false;

		if (env['EMAIL_SMTP_USER'] || env['EMAIL_SMTP_PASSWORD']) {
			auth = {
				user: env['EMAIL_SMTP_USER'] as string,
				pass: env['EMAIL_SMTP_PASSWORD'] as string,
			};
		}

		const tls: Record<string, unknown> = getConfigFromEnv('EMAIL_SMTP_TLS_');

		transporter = nodemailer.createTransport({
			name: env['EMAIL_SMTP_NAME'],
			pool: env['EMAIL_SMTP_POOL'],
			host: env['EMAIL_SMTP_HOST'],
			port: env['EMAIL_SMTP_PORT'],
			secure: env['EMAIL_SMTP_SECURE'],
			ignoreTLS: env['EMAIL_SMTP_IGNORE_TLS'],
			auth,
			tls,
		} as Record<string, unknown>);
	} else if (transportName === 'mailgun') {
		const mg = require('nodemailer-mailgun-transport');

		transporter = nodemailer.createTransport(
			mg({
				auth: {
					api_key: env['EMAIL_MAILGUN_API_KEY'],
					domain: env['EMAIL_MAILGUN_DOMAIN'],
				},
				host: env['EMAIL_MAILGUN_HOST'] || 'api.mailgun.net',
			}) as any,
		);
	} else if (transportName === 'mailtrap') {
		transporter = createMailtrapTransport(env, logger);
	} else {
		logger.warn('Illegal transport given for email. Check the EMAIL_TRANSPORT env var.');
	}

	return transporter;
}

function createMailtrapTransport(env: Record<string, unknown>, logger: Logger): Transporter {
	const { MailtrapTransport } = require('mailtrap') as typeof import('mailtrap');

	const token = env['EMAIL_MAILTRAP_TOKEN'];

	if (typeof token !== 'string' || token.trim() === '') {
		throw new Error('A valid EMAIL_MAILTRAP_TOKEN environment variable is required');
	}

	const mailtrapOptions: import('mailtrap').MailtrapClientConfig = {
		token,
	};

	const inboxId = env['EMAIL_MAILTRAP_INBOX_ID'];

	if (typeof inboxId === 'number' && Number.isSafeInteger(inboxId) && inboxId > 0) {
		mailtrapOptions.testInboxId = inboxId;
	} else if (inboxId !== undefined) {
		logger.warn('Illegal inbox ID given for email. Check the EMAIL_MAILTRAP_INBOX_ID env var.');
	}

	const sandbox = env['EMAIL_MAILTRAP_SANDBOX'];

	if (sandbox === true) {
		// Mailtrap validates this only when sending, so fail during startup instead.
		if (mailtrapOptions.testInboxId === undefined) {
			throw new Error(
				`Sandbox mode requires a valid EMAIL_MAILTRAP_INBOX_ID environment variable, received: ${inboxId}`,
			);
		}

		mailtrapOptions.sandbox = true;
	} else if (sandbox !== undefined && sandbox !== false) {
		logger.warn('Illegal sandbox flag given for email. Check the EMAIL_MAILTRAP_SANDBOX env var.');
	}

	const bulk = env['EMAIL_MAILTRAP_BULK'];

	if (bulk === true) {
		// Mailtrap rejects this combination when sending, not when building the client.
		if (mailtrapOptions.sandbox === true) {
			throw new Error('Bulk mode cannot be combined with sandbox mode for email');
		}

		mailtrapOptions.bulk = true;
	} else if (bulk !== undefined && bulk !== false) {
		logger.warn('Illegal bulk flag given for email. Check the EMAIL_MAILTRAP_BULK env var.');
	}

	return nodemailer.createTransport(MailtrapTransport(mailtrapOptions));
}
