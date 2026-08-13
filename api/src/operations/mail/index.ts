import { useEnv } from '@directus/env';
import { defineOperationApi } from '@directus/extensions';
import { useLogger } from '../../logger/index.js';
import type { EmailOptions } from '../../services/mail/index.js';
import { MailService } from '../../services/mail/index.js';
import { md } from '../../utils/md.js';
import { useFlowsEmailRateLimiter } from './rate-limiter.js';

export type Options = {
	to: string;
	fromName?: string;
	type: 'wysiwyg' | 'markdown' | 'template';
	subject: string;
	body?: string;
	template?: string;
	data?: Record<string, any>;
	cc?: string;
	bcc?: string;
	replyTo?: string;
};

const logger = useLogger();

export default defineOperationApi<Options>({
	id: 'mail',

	handler: async (
		{ body, template, data, to, fromName, type, subject, cc, bcc, replyTo },
		{ accountability, database, getSchema, flow },
	) => {
		await useFlowsEmailRateLimiter(flow!.id);

		const env = useEnv();

		const mailService = new MailService({ schema: await getSchema({ database }), accountability, knex: database });
		const mailObject: EmailOptions = { to, subject, cc, bcc, replyTo };

		const trimmedFromName = fromName?.trim();

		// An incomplete `from` object is rejected by the mail service, so only set it when there's a name to use
		if (trimmedFromName) {
			mailObject.from = { name: trimmedFromName, address: env['EMAIL_FROM'] as string };
		}

		const safeBody = typeof body !== 'string' ? JSON.stringify(body) : body;

		if (type === 'template') {
			mailObject.template = {
				name: template || 'base',
				data: data || {},
			};
		} else {
			mailObject.html = type === 'wysiwyg' ? safeBody : md(safeBody);
		}

		mailService.send(mailObject).catch((error) => {
			logger.error(error, 'Could not send mail in "mail" operation');
		});
	},
});
