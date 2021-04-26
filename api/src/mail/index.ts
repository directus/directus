import database from '../database';
import logger from '../logger';
import nodemailer, { Transporter } from 'nodemailer';
import { Liquid } from 'liquidjs';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import env from '../env';

const readFile = promisify(fs.readFile);

const liquidEngine = new Liquid({
	root: path.resolve(__dirname, 'templates'),
	extname: '.liquid',
});

export let transporter: Transporter | null = null;

if (env.EMAIL_TRANSPORT === 'sendmail') {
	transporter = nodemailer.createTransport({
		sendmail: true,
		newline: env.EMAIL_SENDMAIL_NEW_LINE || 'unix',
		path: env.EMAIL_SENDMAIL_PATH || '/usr/sbin/sendmail',
	});
} else if (env.EMAIL_TRANSPORT.toLowerCase() === 'smtp') {
	transporter = nodemailer.createTransport({
		pool: env.EMAIL_SMTP_POOL,
		host: env.EMAIL_SMTP_HOST,
		port: env.EMAIL_SMTP_PORT,
		secure: env.EMAIL_SMTP_SECURE,
		auth: {
			user: env.EMAIL_SMTP_USER,
			pass: env.EMAIL_SMTP_PASSWORD,
		},
	} as any);
} else {
	logger.warn('Illegal transport given for email. Check the EMAIL_TRANSPORT env var.');
}

if (transporter) {
	transporter.verify((error) => {
		if (error) {
			logger.warn(`Couldn't connect to email server.`);
			logger.warn(`Email verification error: ${error}`);
		} else {
			logger.info(`Email connection established`);
		}
	});
}

export type EmailOptions = {
	to: string; // email address of the recipient
	from: string;
	subject: string;
	text: string;
	html: string;
};

/**
 * Get an object with default template options to pass to the email templates.
 */
async function getDefaultTemplateOptions() {
	const projectInfo = await database
		.select(['project_name', 'project_logo', 'project_color'])
		.from('directus_settings')
		.first();

	return {
		projectName: projectInfo?.project_name || 'Directus',
		projectColor: projectInfo?.project_color || '#546e7a',
		projectLogo: getProjectLogoURL(projectInfo?.project_logo),
	};

	function getProjectLogoURL(logoID?: string) {
		let projectLogoURL = env.PUBLIC_URL;

		if (projectLogoURL.endsWith('/') === false) {
			projectLogoURL += '/';
		}

		if (logoID) {
			projectLogoURL += `assets/${logoID}`;
		} else {
			projectLogoURL += `admin/img/directus-white.png`;
		}

		return projectLogoURL;
	}
}

export default async function sendMail(options: EmailOptions) {
	if (!transporter) return;

	const templateString = await readFile(path.join(__dirname, 'templates/base.liquid'), 'utf8');
	const html = await liquidEngine.parseAndRender(templateString, { html: options.html });

	options.from = options.from || (env.EMAIL_FROM as string);

	try {
		await transporter.sendMail({ ...options, html: html });
	} catch (error) {
		logger.warn('[Email] Unexpected error while sending an email:');
		logger.warn(error);
	}
}

export async function sendInviteMail(email: string, url: string) {
	if (!transporter) return;

	const defaultOptions = await getDefaultTemplateOptions();

	const html = await liquidEngine.renderFile('user-invitation', {
		...defaultOptions,
		email,
		url,
	});

	await transporter.sendMail({
		from: env.EMAIL_FROM,
		to: email,
		html: html,
		subject: `[${defaultOptions.projectName}] You've been invited`,
	});
}

export async function sendPasswordResetMail(email: string, url: string) {
	if (!transporter) return;

	const defaultOptions = await getDefaultTemplateOptions();

	const html = await liquidEngine.renderFile('password-reset', {
		...defaultOptions,
		email,
		url,
	});

	await transporter.sendMail({
		from: env.EMAIL_FROM,
		to: email,
		html: html,
		subject: `[${defaultOptions.projectName}] Password Reset Request`,
	});
}
