import { defineOperationApi } from '@directus/shared/utils';
import { MailService } from '../../services';
import { md } from '../../utils/md';

type Options = {
	body: string;
	template: boolean;
	to: string;
	type: 'wysiwyg' | 'markdown';
	subject: string;
};

export default defineOperationApi<Options>({
	id: 'mail',
	handler: async ({ body, template, type, to, subject }, { accountability, database, getSchema }) => {

		const mailService = new MailService({ schema: await getSchema({ database }), accountability, knex: database });
		const formated_body = template
			? {
					template: {
						name: 'base',
						data: {
							html: type === 'wysiwyg' ? body : md(body)
						},
					},
			  }
			: { html:type === 'wysiwyg' ? body : md(body) };
		await mailService.send({
			...formated_body,
			to,
			subject,
		});
	},
});
