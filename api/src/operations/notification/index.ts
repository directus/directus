import { defineOperationApi } from '@directus/shared/utils';
import { NotificationsService } from '../../services';

type Options = {
	recipient: string;
	subject: string;
	message: string | null;
};

export default defineOperationApi<Options>({
	id: 'notification',

	handler: async ({ recipient, subject, message }, { accountability, database, getSchema }) => {
		const notificationsService = new NotificationsService({
			schema: await getSchema({ database }),
			accountability,
			knex: database,
		});

		const result = await notificationsService.createOne({
			recipient,
			subject,
			message,
		});

		return result;
	},
});
