import { defineOperationApi } from '@directus/shared/utils';
import { MailService } from '../../services';
import { md } from '../../utils/md';

type Options = {
	body: string;
	template: boolean;
	to: string;
	subject: string;
};

export default defineOperationApi<Options>({
	id: 'mail',

	handler: async ({ body, template, to, subject }, { accountability, database, getSchema }) => {
		const mailService = new MailService({ schema: await getSchema({ database }), accountability, knex: database });
		const formated_body = template
			? {
					template: {
						name: 'base',
						data: {
							html: body ? md(body) : '',
						},
					},
			  }
			: { html: md(body) };
		await mailService.send({
			...formated_body,
			to,
			subject,
		});
	},
});
