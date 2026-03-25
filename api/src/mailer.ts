import { createRequire } from 'node:module';
import { useEnv } from '@directus/env';
import type { Transporter } from 'nodemailer';
import nodemailer from 'nodemailer';
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
	} else {
		logger.warn('Illegal transport given for email. Check the EMAIL_TRANSPORT env var.');
	}

	return transporter;
}
