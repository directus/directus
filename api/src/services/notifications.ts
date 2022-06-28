import { AbstractServiceOptions, PrimaryKey, MutationOptions } from '../types';
import { ItemsService } from './items';
import { Notification } from '@directus/shared/types';
import { md } from '../utils/md';
import { UsersService } from './users';
import { MailService } from './mail';
import logger from '../logger';

export class NotificationsService extends ItemsService {
	usersService: UsersService;
	mailService: MailService;

	constructor(options: AbstractServiceOptions) {
		super('directus_notifications', options);
		this.usersService = new UsersService({ schema: this.schema });
		this.mailService = new MailService({ schema: this.schema, accountability: this.accountability });
	}

	async createOne(data: Partial<Notification>, opts?: MutationOptions): Promise<PrimaryKey> {
		const response = await super.createOne(data, opts);

		await this.sendEmail(data);

		return response;
	}

	async createMany(data: Partial<Notification>[], opts?: MutationOptions): Promise<PrimaryKey[]> {
		const response = await super.createMany(data, opts);

		for (const notification of data) {
			await this.sendEmail(notification);
		}

		return response;
	}

	async sendEmail(data: Partial<Notification>) {
		if (data.recipient) {
			const user = await this.usersService.readOne(data.recipient, { fields: ['email', 'email_notifications'] });

			if (user.email && user.email_notifications === true) {
				try {
					await this.mailService.send({
						template: {
							name: 'base',
							data: {
								html: data.message ? md(data.message) : '',
							},
						},
						to: user.email,
						subject: data.subject,
					});
				} catch (error: any) {
					logger.error(error.message);
				}
			}
		}
	}
}
