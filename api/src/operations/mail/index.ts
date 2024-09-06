import { defineOperationApi } from '@directus/extensions';
import type { EmailOptions } from '../../services/mail/index.js';
import { MailService } from '../../services/mail/index.js';
import { md } from '../../utils/md.js';
import { useLogger } from '../../logger/index.js';

export type Options = {
	body?: string;
	template?: string;
	data?: Record<string, any>;
	to: string;
	type: 'wysiwyg' | 'markdown' | 'template';
	subject: string;
};

const logger = useLogger();

export default defineOperationApi<Options>({
	id: 'mail',

	handler: async ({ body, template, data, to, type, subject }, { accountability, database, getSchema }) => {
		const mailService = new MailService({ schema: await getSchema({ database }), accountability, knex: database });
		const mailObject: EmailOptions = { to, subject };
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
