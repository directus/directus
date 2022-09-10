import { defineOperationApi } from '@directus/shared/utils';
import { MailService } from '../../services';
import { md } from '../../utils/md';

type Options = {
	body_markdown: string;
	body_wysiwyg: string;
	use_wysiwyg_editor: boolean;
	to: string;
	subject: string;
};

export default defineOperationApi<Options>({
	id: 'mail',

	handler: async (
		{ body_markdown, body_wysiwyg, use_wysiwyg_editor, to, subject },
		{ accountability, database, getSchema }
	) => {
		const mailService = new MailService({ schema: await getSchema({ database }), accountability, knex: database });

		await mailService.send({
			html: use_wysiwyg_editor ? body_wysiwyg : md(body_markdown),
			to,
			subject,
		});
	},
});
