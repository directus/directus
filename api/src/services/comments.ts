import { useEnv } from '@directus/env';
import { ErrorCode, ForbiddenError, InvalidPayloadError, isDirectusError } from '@directus/errors';
import type { AbstractServiceOptions, Accountability, Comment, MutationOptions, PrimaryKey } from '@directus/types';
import { uniq } from 'lodash-es';
import { useLogger } from '../logger/index.js';
import { fetchRolesTree } from '../permissions/lib/fetch-roles-tree.js';
import { fetchGlobalAccess } from '../permissions/modules/fetch-global-access/fetch-global-access.js';
import { validateAccess } from '../permissions/modules/validate-access/validate-access.js';
import { isValidUuid } from '../utils/is-valid-uuid.js';
import { Url } from '../utils/url.js';
import { userName } from '../utils/user-name.js';
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

	override async createOne(data: Partial<Comment>, opts?: MutationOptions): Promise<PrimaryKey> {
		if (!this.accountability?.user) throw new ForbiddenError();

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

		const result = await super.createOne(data, opts);

		const usersRegExp = new RegExp(/@[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}/gi);

		const mentions = uniq(data['comment'].match(usersRegExp) ?? []);

		if (mentions.length === 0) {
			return result;
		}

		const sender = await this.usersService.readOne(this.accountability.user, {
			fields: ['id', 'first_name', 'last_name', 'email'],
		});

		for (const mention of mentions) {
			const userID = mention.substring(1);

			const user = await this.usersService.readOne(userID, {
				fields: ['id', 'first_name', 'last_name', 'email', 'role.id'],
			});

			const accountability: Accountability = {
				user: userID,
				role: user['role']?.id ?? null,
				admin: false,
				app: false,
				roles: await fetchRolesTree(user['role']?.id ?? null, { knex: this.knex }),
				ip: null,
			};

			const userGlobalAccess = await fetchGlobalAccess(accountability, this.knex);

			accountability.admin = userGlobalAccess.admin;
			accountability.app = userGlobalAccess.app;

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

		return result;
	}

	override updateOne(key: PrimaryKey, data: Partial<Comment>, opts?: MutationOptions): Promise<PrimaryKey> {
		if (!this.accountability?.user) throw new ForbiddenError();

		return super.updateOne(key, data, opts);
	}

	override deleteOne(key: PrimaryKey, opts?: MutationOptions): Promise<PrimaryKey> {
		if (!this.accountability?.user) throw new ForbiddenError();

		return super.deleteOne(key, opts);
	}
}
