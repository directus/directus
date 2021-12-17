import { AbstractServiceOptions, ShareData, LoginResult, Item, PrimaryKey, MutationOptions } from '../types';
import { ItemsService } from './items';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import ms from 'ms';
import { InvalidCredentialsException } from '../exceptions';
import env from '../env';
import { nanoid } from 'nanoid';
import { AuthorizationService } from './authorization';

export class SharesService extends ItemsService {
	constructor(options: AbstractServiceOptions) {
		super('directus_shares', options);
	}

	async createOne(data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey> {
		const authorizationService = new AuthorizationService({
			accountability: this.accountability,
			knex: this.knex,
			schema: this.schema,
		});

		await authorizationService.checkAccess('share', data.collection, data.item);
		return super.createOne(data, opts);
	}

	async login(payload: Record<string, any>): Promise<LoginResult> {
		const record = await this.knex
			.select<ShareData>({
				share_id: 'id',
				share_role: 'role',
				share_item: 'item',
				share_collection: 'collection',
				share_start: 'date_start',
				share_end: 'date_end',
				share_times_used: 'times_used',
				share_max_uses: 'max_uses',
				share_password: 'password',
			})
			.from('directus_shares')
			.where('id', payload.share_id)
			.andWhere((subQuery) => {
				subQuery.whereNull('date_end').orWhere('date_end', '>=', this.knex.fn.now());
			})
			.andWhere((subQuery) => {
				subQuery.whereNull('date_start').orWhere('date_start', '<=', this.knex.fn.now());
			})
			.andWhere((subQuery) => {
				subQuery.whereNull('max_uses').orWhere('max_uses', '>=', this.knex.ref('times_used'));
			})
			.first();

		if (!record) {
			throw new InvalidCredentialsException();
		}

		if (record.share_password && !(await argon2.verify(record.share_password, payload.password))) {
			throw new InvalidCredentialsException();
		}

		await this.knex('directus_shares')
			.update({ times_used: record.share_times_used + 1 })
			.where('id', record.share_id);

		const tokenPayload = {
			app_access: false,
			admin_access: false,
			role: record.share_role,
			share_scope: {
				item: record.share_item,
				collection: record.share_collection,
			},
		};

		const accessToken = jwt.sign(tokenPayload, env.SECRET as string, {
			expiresIn: env.ACCESS_TOKEN_TTL,
			issuer: 'directus',
		});

		const refreshToken = nanoid(64);
		const refreshTokenExpiration = new Date(Date.now() + ms(env.REFRESH_TOKEN_TTL as string));

		await this.knex('directus_sessions').insert({
			token: refreshToken,
			expires: refreshTokenExpiration,
			ip: this.accountability?.ip,
			user_agent: this.accountability?.userAgent,
			share: record.share_id,
		});

		await this.knex('directus_sessions').delete().where('expires', '<', new Date());

		return {
			accessToken,
			refreshToken,
			expires: ms(env.ACCESS_TOKEN_TTL as string),
		};
	}
}
