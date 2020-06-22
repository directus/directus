import logger from '../logger';
import nodemailer, { Transporter } from 'nodemailer';
import { Liquid } from 'liquidjs';
import path from 'path';

const liquidEngine = new Liquid({
	root: path.join(__dirname, 'templates'),
});

logger.trace('[Email] Initializing email transport...');

if (!process.env.EMAIL_TRANSPORT) {
	logger.warn(`[Email] No email transport is configured. Using default: sendmail.`);
}

const emailTransport = process.env.EMAIL_TRANSPORT || 'sendmail';

let transporter: Transporter;

if (emailTransport === 'sendmail') {
	transporter = nodemailer.createTransport({
		sendmail: true,
		newline: process.env.EMAIL_SENDMAIL_NEW_LINE || 'unix',
		path: process.env.EMAIL_SENDMAIL_PATH || '/usr/sbin/sendmail',
	});
} else if (emailTransport.toLowerCase() === 'smtp') {
	console.log({
		pool: process.env.EMAIL_SMTP_POOL === 'true',
		host: process.env.EMAIL_SMTP_HOST,
		port: Number(process.env.EMAIL_SMTP_PORT),
		secure: process.env.EMAIL_SMTP_SECURE === 'true',
		auth: {
			user: process.env.EMAIL_SMTP_USER,
			pass: process.env.EMAIL_SMTP_PASSWORD,
		},
	});

	transporter = nodemailer.createTransport({
		pool: process.env.EMAIL_SMTP_POOL === 'true',
		host: process.env.EMAIL_SMTP_HOST,
		port: Number(process.env.EMAIL_SMTP_PORT),
		secure: process.env.EMAIL_SMTP_SECURE === 'true',
		auth: {
			user: process.env.EMAIL_SMTP_USER,
			pass: process.env.EMAIL_SMTP_PASSWORD,
		},
	} as any);

	logger.trace('[Email] Verifying SMTP connection.');

	transporter
		.verify()
		.then(() => {
			logger.info('[Email] SMTP connected. Ready to send emails.');
		})
		.catch((err) => {
			logger.error(`[Email] Couldn't connect to SMTP server:`);
			logger.error(err);
		});
}

export type EmailOptions = {
	to: string; // email address of the recipient
	subject: string;
	text: string;
	html: string;
};

export default async function sendMail(options: EmailOptions) {
	const html = await liquidEngine.renderFile('base.liquid', { html: options.html });

	try {
		await transporter.sendMail({ ...options, html: html });
	} catch (error) {
		logger.warn('[Email] Unexpected error while sending an email:');
		logger.warn(error);
	}
}
