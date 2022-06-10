import { defineOperationApi } from '@directus/shared/utils';
import { MailService } from '../../services';
import { md } from '../../utils/md';

type Options = {
	body: string;
	to: string;
	subject: string;
};

export default defineOperationApi<Options>({
	id: 'mail',

	handler: async ({ body, to, subject }, { accountability, database, getSchema }) => {
		const mailService = new MailService({ schema: await getSchema({ database }), accountability, knex: database });

		await mailService.send({
			html: md(body),
			to,
			subject,
		});
	},
});
