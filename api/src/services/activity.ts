import { AbstractServiceOptions, PrimaryKey, Item, Action } from '../types';
import { ItemsService, MutationOptions } from './index';
import { NotificationsService } from './notifications';
import { Notification } from '@directus/shared/types';

export class ActivityService extends ItemsService {
	notificationsService: NotificationsService;

	constructor(options: AbstractServiceOptions) {
		super('directus_activity', options);
		this.notificationsService = new NotificationsService({ schema: this.schema });
	}

	async createOne(data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey> {
		if (data.action === Action.COMMENT && typeof data.comment === 'string') {
			const usersRegExp = new RegExp(/@[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}/gi);

			const users = data.comment.match(usersRegExp);

			if (users) {
				const notifications = users.map((user): Partial<Notification> => {
					const userID = user.substring(1);

					return {
						recipient: userID,
						message: data.comment,
						sender: this.accountability?.user,
						subject: 'You were mentioned!',
					};
				});

				await this.notificationsService.createMany(notifications);
			}
		}

		return super.createOne(data, opts);
	}
}
