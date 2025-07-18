import { useEnv } from '@directus/env';
import type { Transporter } from 'nodemailer';
import type { EmailOptionsOverrides } from './services/mail/index.js';
import nodemailer from 'nodemailer';
import crypto from 'node:crypto';
import { useLogger } from './logger/index.js';
import { getConfigFromEnv } from './utils/get-config-from-env.js';

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const transporter: Record<string, Transporter> = {};

export default function getMailer(overrides?: EmailOptionsOverrides): Transporter {
	// if there is an existing transporter, try to reuse it, minding the overrides
	const hash = overrides
		? crypto
				.createHash('md5')
				.update(
					JSON.stringify(overrides, (_key, value) => {
						if (value && typeof value === 'object' && !Array.isArray(value)) {
							return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)));
						}

						return value;
					}),
				)
				.digest('hex')
		: 'default';

	if (transporter[`${hash}`]) return transporter[`${hash}`] as Transporter;

	const env = useEnv();
	const logger = useLogger();

	const transportName = overrides?.transport?.toLowerCase() || (env['EMAIL_TRANSPORT'] as string).toLowerCase();

	if (transportName === 'sendmail') {
		transporter[`${hash}`] = nodemailer.createTransport({
			sendmail: true,
			newline: overrides?.sendmail?.newline || (env['EMAIL_SENDMAIL_NEW_LINE'] as string) || 'unix',
			path: overrides?.sendmail?.path || (env['EMAIL_SENDMAIL_PATH'] as string) || '/usr/sbin/sendmail',
		});
	} else if (transportName === 'ses') {
		const aws = require('@aws-sdk/client-ses');

		const sesOptions: Record<string, unknown> = getConfigFromEnv('EMAIL_SES_');

		const ses = new aws.SES(sesOptions);

		transporter[`${hash}`] = nodemailer.createTransport({
			SES: { ses, aws },
		} as Record<string, unknown>);
	} else if (transportName === 'smtp') {
		let auth: boolean | { user?: string; pass?: string } = false;

		if (env['EMAIL_SMTP_USER'] || env['EMAIL_SMTP_PASSWORD'] || overrides?.smtp?.user || overrides?.smtp?.pass) {
			auth = {
				user: overrides?.smtp?.user || (env['EMAIL_SMTP_USER'] as string),
				pass: overrides?.smtp?.pass || (env['EMAIL_SMTP_PASSWORD'] as string),
			};
		}

		const tls: Record<string, unknown> = getConfigFromEnv('EMAIL_SMTP_TLS_');

		transporter[`${hash}`] = nodemailer.createTransport({
			name: overrides?.smtp?.name || env['EMAIL_SMTP_NAME'],
			pool: overrides?.smtp?.pool || env['EMAIL_SMTP_POOL'],
			host: overrides?.smtp?.host || env['EMAIL_SMTP_HOST'],
			port: overrides?.smtp?.port || env['EMAIL_SMTP_PORT'],
			secure: overrides?.smtp?.secure || env['EMAIL_SMTP_SECURE'],
			ignoreTLS: overrides?.smtp?.ignoreTLS || env['EMAIL_SMTP_IGNORE_TLS'],
			auth,
			tls,
		} as Record<string, unknown>);
	} else if (transportName === 'mailgun') {
		const mg = require('nodemailer-mailgun-transport');

		transporter[`${hash}`] = nodemailer.createTransport(
			mg({
				auth: {
					api_key: overrides?.mailgun?.apiKey || env['EMAIL_MAILGUN_API_KEY'],
					domain: overrides?.mailgun?.domain || env['EMAIL_MAILGUN_DOMAIN'],
				},
				host: overrides?.mailgun?.host || env['EMAIL_MAILGUN_HOST'] || 'api.mailgun.net',
			}) as any,
		);
	} else {
		logger.warn('Illegal transport given for email. Check the EMAIL_TRANSPORT env var.');
	}

	return transporter[`${hash}`] as Transporter;
}
