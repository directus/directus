import type { Notification } from '@directus/types';
import { useEnv } from '../env.js';
import { useLogger } from '../logger.js';
import type { AbstractServiceOptions, MutationOptions, PrimaryKey } from '../types/index.js';
import { md } from '../utils/md.js';
import { Url } from '../utils/url.js';
import { ItemsService } from './items.js';
import { MailService } from './mail/index.js';
import { UsersService } from './users.js';

const env = useEnv();
const logger = useLogger();

export class NotificationsService extends ItemsService {
	usersService: UsersService;
	mailService: MailService;

	constructor(options: AbstractServiceOptions) {
		super('directus_notifications', options);
		this.usersService = new UsersService({ schema: this.schema });
		this.mailService = new MailService({ schema: this.schema, accountability: this.accountability });
	}

	override async createOne(data: Partial<Notification>, opts?: MutationOptions): Promise<PrimaryKey> {
		const response = await super.createOne(data, opts);

		await this.sendEmail(data);

		return response;
	}

	override async createMany(data: Partial<Notification>[], opts?: MutationOptions): Promise<PrimaryKey[]> {
		const response = await super.createMany(data, opts);

		for (const notification of data) {
			await this.sendEmail(notification);
		}

		return response;
	}

	async sendEmail(data: Partial<Notification>) {
		if (data.recipient) {
			const user = await this.usersService.readOne(data.recipient, {
				fields: ['id', 'email', 'email_notifications', 'role.app_access'],
			});

			const manageUserAccountUrl = new Url(env['PUBLIC_URL']).addPath('admin', 'users', user['id']).toString();

			const html = data.message ? md(data.message) : '';

			if (user['email'] && user['email_notifications'] === true) {
				try {
					await this.mailService.send({
						template: {
							name: 'base',
							data: user['role']?.app_access ? { url: manageUserAccountUrl, html } : { html },
						},
						to: user['email'],
						subject: data.subject,
					});
				} catch (error: any) {
					logger.error(error.message);
				}
			}
		}
	}
}
