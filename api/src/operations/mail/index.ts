import { defineOperationApi } from '@directus/extensions';
import type { EmailOptions } from '../../services/mail/index.js';
import { MailService } from '../../services/mail/index.js';
import { md } from '../../utils/md.js';
import { useLogger } from '../../logger/index.js';
import { getFlowsEmailRateLimiter } from './rate-limiter.js';
import { HitRateLimitError } from '@directus/errors';

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
		{ accountability, database, getSchema, flow, env },
	) => {
		try {
			await getFlowsEmailRateLimiter()?.consume(flow!.id, 1);
		} catch (err: unknown) {
			if (err instanceof Error) {
				const resetIn = (err as unknown as any)?.msBeforeNext ?? Number(env['EMAIL_FLOWS_LIMITER_DURATION']) * 1000;
				throw new HitRateLimitError(
					{
						limit: Number(env['EMAIL_FLOWS_LIMITER_POINTS'] as string),
						reset: new Date(Date.now() + resetIn),
					},
					{
						cause: err.message,
					},
				);
			}

			throw err;
		}

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
