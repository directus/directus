import { ItemsService } from './items.js';
import { UsersService } from './users.js';
import { useLogger } from '../logger/index.js';
import { MailService } from './mail/index.js';
import { fetchRolesTree } from '../permissions/lib/fetch-roles-tree.js';
import { fetchGlobalAccess } from '../permissions/modules/fetch-global-access/fetch-global-access.js';
import { md } from '../utils/md.js';
import { Url } from '../utils/url.js';
import { useEnv } from '@directus/env';
import type { AbstractServiceOptions, MutationOptions, Notification, PrimaryKey } from '@directus/types';

const env = useEnv();
const logger = useLogger();

export class NotificationsService extends ItemsService {
	constructor(options: AbstractServiceOptions) {
		super('directus_notifications', options);
	}

	override async createOne(data: Partial<Notification>, opts?: MutationOptions): Promise<PrimaryKey> {
		const response = await super.createOne(data, opts);

		await this.sendEmail(data);

		return response;
	}

	async sendEmail(data: Partial<Notification>) {
		if (data.recipient) {
			const usersService = new UsersService({ schema: this.schema, knex: this.knex });

			const user = await usersService.readOne(data.recipient, {
				fields: ['id', 'email', 'email_notifications', 'role'],
			});

			if (user['email'] && user['email_notifications'] === true) {
				const manageUserAccountUrl = new Url(env['PUBLIC_URL'] as string)
					.addPath('admin', 'users', user['id'])
					.toString();

				const html = data.message ? md(data.message) : '';
				const roles = await fetchRolesTree(user['role'], { knex: this.knex });

				const { app: app_access } = await fetchGlobalAccess(
					{
						user: user['id'],
						roles,
						ip: null,
					},
					{ knex: this.knex },
				);

				const mailService = new MailService({
					schema: this.schema,
					knex: this.knex,
					accountability: this.accountability,
				});

				mailService
					.send(
						{
							template: {
								name: 'base',
								data: app_access ? { url: manageUserAccountUrl, html } : { html },
							},
							to: user['email'],
							subject: data.subject,
						},
						{
							defaultTemplateData: await mailService.getDefaultTemplateData(),
						},
					)
					.catch((error) => {
						logger.error(error, `Could not send notification via mail`);
					});
			}
		}
	}
}
