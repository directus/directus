import { UsersService, MailService } from '.';
import { AbstractServiceOptions, PrimaryKey } from '../types';
import { ItemsService, MutationOptions } from './items';
import { Notification } from '@directus/shared/types';
import { md } from '../utils/md';

export class NotificationsService extends ItemsService {
	usersService: UsersService;
	mailService: MailService;

	constructor(options: AbstractServiceOptions) {
		super('directus_notifications', options);
		this.usersService = new UsersService({ schema: this.schema });
		this.mailService = new MailService({ schema: this.schema, accountability: this.accountability });
	}

	async createOne(data: Partial<Notification>, opts?: MutationOptions): Promise<PrimaryKey> {
		await this.sendEmail(data);
		return super.createOne(data, opts);
	}

	async createMany(data: Partial<Notification>[], opts?: MutationOptions): Promise<PrimaryKey[]> {
		for (const notification of data) {
			await this.sendEmail(notification);
		}

		return super.createMany(data, opts);
	}

	async sendEmail(data: Partial<Notification>) {
		if (data.recipient) {
			const user = await this.usersService.readOne(data.recipient, { fields: ['email', 'email_notifications'] });

			if (user.email && user.email_notifications === true) {
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
			}
		}
	}
}
