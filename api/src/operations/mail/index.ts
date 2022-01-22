import { defineOperationApi } from '@directus/shared/utils';
import { MailService } from '../../services';

type Options = {
	template: string;
	data: string;
	to: string;
	subject: string;
};

export default defineOperationApi<Options>({
	id: 'mail',

	handler: async ({ template, data, to, subject }, { accountability, database, getSchema }) => {
		const mailService = new MailService({ schema: await getSchema({ database }), accountability, knex: database });

		await mailService.send({
			template: {
				name: template,
				data: JSON.parse(data),
			},
			to,
			subject,
		});
	},
});
