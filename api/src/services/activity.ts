import { Action } from '@directus/constants';
import { useEnv } from '@directus/env';
import { ErrorCode, isDirectusError } from '@directus/errors';
import type { Accountability, Item, PrimaryKey } from '@directus/types';
import { uniq } from 'lodash-es';
import { useLogger } from '../logger/index.js';
import { fetchRolesTree } from '../permissions/lib/fetch-roles-tree.js';
import { fetchGlobalAccess } from '../permissions/modules/fetch-global-access/fetch-global-access.js';
import { validateAccess } from '../permissions/modules/validate-access/validate-access.js';
import { createDefaultAccountability } from '../permissions/utils/create-default-accountability.js';
import type { AbstractServiceOptions, MutationOptions } from '../types/index.js';
import { isValidUuid } from '../utils/is-valid-uuid.js';
import { Url } from '../utils/url.js';
import { userName } from '../utils/user-name.js';
import { ItemsService } from './items.js';
import { NotificationsService } from './notifications.js';
import { UsersService } from './users.js';

const env = useEnv();
const logger = useLogger();

export class ActivityService extends ItemsService {
	notificationsService: NotificationsService;
	usersService: UsersService;

	constructor(options: AbstractServiceOptions) {
		super('directus_activity', options);
		this.notificationsService = new NotificationsService({ schema: this.schema });
		this.usersService = new UsersService({ schema: this.schema });
	}

	override async createOne(data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey> {
		if (data['action'] === Action.COMMENT && typeof data['comment'] === 'string') {
			const usersRegExp = new RegExp(/@[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}/gi);

			const mentions = uniq(data['comment'].match(usersRegExp) ?? []);

			const sender = await this.usersService.readOne(this.accountability!.user!, {
				fields: ['id', 'first_name', 'last_name', 'email'],
			});

			for (const mention of mentions) {
				const userID = mention.substring(1);

				const user = await this.usersService.readOne(userID, {
					fields: ['id', 'first_name', 'last_name', 'email', 'role'],
				});

				const roles = await fetchRolesTree(user['role'], this.knex);
				const globalAccess = await fetchGlobalAccess({ user: user['id'], roles, ip: null }, this.knex);

				const accountability: Accountability = createDefaultAccountability({
					user: userID,
					role: user['role']?.id ?? null,
					roles,
					...globalAccess,
				});

				const usersService = new UsersService({ schema: this.schema, accountability });

				try {
					if (this.accountability) {
						await validateAccess(
							{
								accountability: this.accountability,
								action: 'read',
								collection: data['collection'],
								primaryKeys: [data['item']],
							},
							{
								knex: this.knex,
								schema: this.schema,
							},
						);
					}

					const templateData = await usersService.readByQuery({
						fields: ['id', 'first_name', 'last_name', 'email'],
						filter: { id: { _in: mentions.map((mention) => mention.substring(1)) } },
					});

					const userPreviews = templateData.reduce(
						(acc, user) => {
							acc[user['id']] = `<em>${userName(user)}</em>`;
							return acc;
						},
						{} as Record<string, string>,
					);

					let comment = data['comment'];

					for (const mention of mentions) {
						const uuid = mention.substring(1);
						// We only match on UUIDs in the first place. This is just an extra sanity check.
						if (isValidUuid(uuid) === false) continue;
						comment = comment.replace(new RegExp(mention, 'gm'), userPreviews[uuid] ?? '@Unknown User');
					}

					comment = `> ${comment.replace(/\n+/gm, '\n> ')}`;

					const href = new Url(env['PUBLIC_URL'] as string)
						.addPath('admin', 'content', data['collection'], data['item'])
						.toString();

					const message = `
Hello ${userName(user)},

${userName(sender)} has mentioned you in a comment:

${comment}

<a href="${href}">Click here to view.</a>
`;

					await this.notificationsService.createOne({
						recipient: userID,
						sender: sender['id'],
						subject: `You were mentioned in ${data['collection']}`,
						message,
						collection: data['collection'],
						item: data['item'],
					});
				} catch (err: any) {
					if (isDirectusError(err, ErrorCode.Forbidden)) {
						logger.warn(`User ${userID} doesn't have proper permissions to receive notification for this item.`);
					} else {
						throw err;
					}
				}
			}
		}

		return super.createOne(data, opts);
	}
}
