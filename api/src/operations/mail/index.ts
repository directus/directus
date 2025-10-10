import { defineOperationApi } from '@directus/extensions';
import type { EmailOptions } from '../../services/mail/index.js';
import { MailService } from '../../services/mail/index.js';
import { md } from '../../utils/md.js';
import { useLogger } from '../../logger/index.js';
import { useFlowsEmailRateLimiter } from './rate-limiter.js';

export type Options = {
	to: string;
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
		{ body, template, data, to, type, subject, cc, bcc, replyTo },
		{ accountability, database, getSchema, flow },
	) => {
		await useFlowsEmailRateLimiter(flow!.id);

		const mailService = new MailService({ schema: await getSchema({ database }), accountability, knex: database });
		const mailObject: EmailOptions = { to, subject, cc, bcc, replyTo };
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
