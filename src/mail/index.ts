import logger from '../logger';
import nodemailer, { Transporter } from 'nodemailer';
import { Liquid } from 'liquidjs';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);

const liquidEngine = new Liquid({
	root: path.resolve(__dirname, 'templates'),
	extname: '.liquid',
});

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
}

export type EmailOptions = {
	to: string; // email address of the recipient
	from: string;
	subject: string;
	text: string;
	html: string;
};

export default async function sendMail(options: EmailOptions) {
	const templateString = await readFile(path.join(__dirname, 'templates/base.liquid'), 'utf8');
	const html = await liquidEngine.parseAndRender(templateString, { html: options.html });

	options.from = options.from || (process.env.EMAIL_FROM as string);

	try {
		await transporter.sendMail({ ...options, html: html });
	} catch (error) {
		logger.warn('[Email] Unexpected error while sending an email:');
		logger.warn(error);
	}
}

export async function sendInviteMail(email: string, url: string) {
	/**
	 * @TODO pull this from directus_settings
	 */
	const projectName = 'directus';

	const html = await liquidEngine.renderFile('user-invitation', { email, url, projectName });
	await transporter.sendMail({ from: process.env.EMAIL_FROM, to: email, html: html });
}
