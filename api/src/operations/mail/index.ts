import { defineOperationApi } from '@directus/shared/utils';
import { MailService } from '../../services';
import { md } from '../../utils/md';

type Options = {
	body: string;
	to: string;
	type: 'wysiwyg' | 'markdown';
	subject: string;
};

export default defineOperationApi<Options>({
	id: 'mail',

	handler: async ({ body, to, type, subject }, { accountability, database, getSchema }) => {
		const mailService = new MailService({ schema: await getSchema({ database }), accountability, knex: database });

		await mailService.send({
			html: type === 'wysiwyg' ? body : md(body),
			to,
			subject,
		});
	},
});
