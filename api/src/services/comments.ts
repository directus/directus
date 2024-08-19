import { Action } from '@directus/constants';
import { useEnv } from '@directus/env';
import { ErrorCode, ForbiddenError, InvalidPayloadError, isDirectusError } from '@directus/errors';
import type { Accountability, Comment, PrimaryKey } from '@directus/types';
import { uniq } from 'lodash-es';
import { useLogger } from '../logger/index.js';
import { fetchRolesTree } from '../permissions/lib/fetch-roles-tree.js';
import { validateAccess } from '../permissions/modules/validate-access/validate-access.js';
import type { AbstractServiceOptions, MutationOptions } from '../types/index.js';
import { isValidUuid } from '../utils/is-valid-uuid.js';
import { transaction } from '../utils/transaction.js';
import { Url } from '../utils/url.js';
import { userName } from '../utils/user-name.js';
import { ActivityService } from './activity.js';
import { ItemsService } from './items.js';
import { NotificationsService } from './notifications.js';
import { UsersService } from './users.js';

const env = useEnv();
const logger = useLogger();

export class CommentsService extends ItemsService {
	notificationsService: NotificationsService;
	usersService: UsersService;

	constructor(options: AbstractServiceOptions) {
		super('directus_comments', options);
		this.notificationsService = new NotificationsService({ schema: this.schema });
		this.usersService = new UsersService({ schema: this.schema });
	}

	override async createOne(
		data: Partial<Comment>,
		opts?: MutationOptions & { skipMentions?: boolean },
	): Promise<PrimaryKey> {
		if (!data['comment']) {
			throw new InvalidPayloadError({ reason: `"comment" is required` });
		}

		if (!data['collection']) {
			throw new InvalidPayloadError({ reason: `"collection" is required` });
		}

		if (!data['item']) {
			throw new InvalidPayloadError({ reason: `"item" is required` });
		}

		if (this.accountability) {
			await validateAccess(
				{
					accountability: this.accountability,
					action: 'read',
					collection: data['collection'],
					primaryKeys: [data['item']],
				},
				{
					schema: this.schema,
					knex: this.knex,
				},
			);
		}

		const usersRegExp = new RegExp(/@[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}/gi);

		const mentions = uniq(data['comment'].match(usersRegExp) ?? []);

		const sender = await this.usersService.readOne(this.accountability!.user!, {
			fields: ['id', 'first_name', 'last_name', 'email'],
		});

		if (!opts?.skipMentions) {
			for (const mention of mentions) {
				const userID = mention.substring(1);

				const user = await this.usersService.readOne(userID, {
					fields: ['id', 'first_name', 'last_name', 'email', 'role.id', 'role.admin_access', 'role.app_access'],
				});

				const accountability: Accountability = {
					user: userID,
					role: user['role']?.id ?? null,
					admin: user['role']?.admin_access ?? null,
					app: user['role']?.app_access ?? null,
					roles: await fetchRolesTree(user['role']?.id, this.knex),
					ip: null,
				};

				const usersService = new UsersService({ schema: this.schema, accountability });

				try {
					await validateAccess(
						{
							accountability,
							action: 'read',
							collection: data['collection'],
							primaryKeys: [data['item']],
						},
						{
							schema: this.schema,
							knex: this.knex,
						},
					);

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

	async migrateComment(activityPk: PrimaryKey): Promise<PrimaryKey> {
		return transaction(this.knex, async (trx) => {
			const sudoCommentsService = new CommentsService({ schema: this.schema, knex: trx });

			const sudoActivityService = new ActivityService({
				schema: this.schema,
				knex: trx,
			});

			const legacyComment = await sudoActivityService.readOne(activityPk);
			let primaryKey;

			// Legacy comment
			if (legacyComment['action'] === Action.COMMENT) {
				primaryKey = await sudoCommentsService.createOne(
					{
						collection: legacyComment['collection'],
						item: legacyComment['item'],
						comment: legacyComment['comment'],
						user_created: legacyComment['user'],
						date_created: legacyComment['timestamp'],
					},
					{
						bypassLimits: true,
						emitEvents: false,
						skipMentions: true,
					},
				);

				await sudoActivityService.updateOne(
					activityPk,
					{
						collection: 'directus_comments',
						action: Action.CREATE,
						item: primaryKey,
					},
					{
						bypassLimits: true,
						emitEvents: false,
					},
				);
			}
			// Migrated comment
			else if (legacyComment['collection'] === 'directus_comment' && legacyComment['action'] === Action.CREATE) {
				const newComment = await sudoCommentsService.readOne(legacyComment['item'], { fields: ['id'] });
				primaryKey = newComment['id'];
			}

			if (!primaryKey) {
				throw new ForbiddenError();
			}

			return primaryKey;
		});
	}
}
