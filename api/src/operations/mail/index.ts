import { defineOperationApi } from '@directus/shared/utils';
import { MailService, EmailOptions } from '../../services';
import { md } from '../../utils/md';

export type Options = {
	body?: string;
	template?: string;
	data?: Record<string, any>;
	to: string;
	type: 'wysiwyg' | 'markdown' | 'template';
	subject: string;
};

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

		await mailService.send(mailObject);
	},
});
