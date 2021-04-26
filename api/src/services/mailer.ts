import logger from '../logger';
import nodemailer, { Transporter } from 'nodemailer';
import env from '../env';

let transporter: Transporter | null = null;

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

export default transporter;
