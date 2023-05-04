import type { Transporter } from 'nodemailer';
import nodemailer from 'nodemailer';
import env from './env.js';
import logger from './logger.js';
import { getConfigFromEnv } from './utils/get-config-from-env.js';

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

let transporter: Transporter;

export default function getMailer(): Transporter {
	if (transporter) return transporter;

	const transportName = env['EMAIL_TRANSPORT'].toLowerCase();

	if (transportName === 'sendmail') {
		transporter = nodemailer.createTransport({
			sendmail: true,
			newline: env['EMAIL_SENDMAIL_NEW_LINE'] || 'unix',
			path: env['EMAIL_SENDMAIL_PATH'] || '/usr/sbin/sendmail',
		});
	} else if (transportName === 'ses') {
		const aws = require('@aws-sdk/client-ses');

		const sesOptions: Record<string, unknown> = getConfigFromEnv('EMAIL_SES_');

		const ses = new aws.SES(sesOptions);

		transporter = nodemailer.createTransport({
			SES: { ses, aws },
		} as Record<string, unknown>);
	} else if (transportName === 'smtp') {
		let auth: boolean | { user?: string; pass?: string } = false;

		if (env['EMAIL_SMTP_USER'] || env['EMAIL_SMTP_PASSWORD']) {
			auth = {
				user: env['EMAIL_SMTP_USER'],
				pass: env['EMAIL_SMTP_PASSWORD'],
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
			}) as any
		);
	} else if (transportName === 'sendgrid') {
		const sg = require('nodemailer-sendgrid');

		transporter = nodemailer.createTransport(
			sg({
				apiKey: env['EMAIL_SENDGRID_API_KEY'],
			}) as any
		);
	} else {
		logger.warn('Illegal transport given for email. Check the EMAIL_TRANSPORT env var.');
	}

	return transporter;
}
