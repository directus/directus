import { NotificationsService } from '../../services/notifications.js';
import { getAccountabilityForRole } from '../../utils/get-accountability-for-role.js';
import { defineOperationApi } from '@directus/extensions';
import type { Accountability } from '@directus/types';
import { optionToString, toArray } from '@directus/utils';

type Options = {
	recipient: string;
	subject: string;
	message?: unknown | null;
	permissions: string; // $public, $trigger, $full, or UUID of a role
	collection?: string;
	item?: string;
};

export default defineOperationApi<Options>({
	id: 'notification',

	handler: async (
		{ recipient, subject, message, permissions, collection, item },
		{ accountability, database, getSchema },
	) => {
		const schema = await getSchema({ database });
		let customAccountability: Accountability | null;

		if (!permissions || permissions === '$trigger') {
			customAccountability = accountability;
		} else if (permissions === '$full') {
			customAccountability = null;
		} else if (permissions === '$public') {
			customAccountability = await getAccountabilityForRole(null, { database, schema, accountability });
		} else {
			customAccountability = await getAccountabilityForRole(permissions, { database, schema, accountability });
		}

		const notificationsService = new NotificationsService({
			schema: await getSchema({ database }),
			accountability: customAccountability,
			knex: database,
		});

		const messageString = message ? optionToString(message) : null;
		const collectionString = collection ? optionToString(collection) : null;
		const itemString = item ? optionToString(item) : null;

		const payload = toArray(recipient).map((userId) => {
			return {
				recipient: userId,
				sender: customAccountability?.user ?? null,
				subject,
				message: messageString,
				collection: collectionString,
				item: itemString,
			};
		});

		const result = await notificationsService.createMany(payload);

		return result;
	},
});
