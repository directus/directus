import { AbstractServiceOptions, ShareData, LoginResult } from '../types';
import { ItemsService } from './items';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import ms from 'ms';
import { InvalidCredentialsException } from '../exceptions';
import env from '../env';
import { nanoid } from 'nanoid';

export class SharesService extends ItemsService {
	constructor(options: AbstractServiceOptions) {
		super('directus_shares', options);
	}

	async login(payload: Record<string, any>): Promise<LoginResult> {
		const record = await this.knex
			.select<ShareData>(
				'id AS shared_id',
				'role AS shared_role',
				'item AS shared_item',
				'collection AS shared_collection',
				'date_expired AS shared_expires',
				'times_used AS shared_times_used',
				'max_uses AS shared_max_uses',
				'password AS shared_password'
			)
			.from('directus_shares')
			.where('id', payload.id)
			.first();

		if (!record) {
			throw new InvalidCredentialsException();
		}
		if (record.shared_expires && record.shared_expires < new Date()) {
			throw new InvalidCredentialsException();
		}
		if (record.shared_max_uses && record.shared_max_uses <= record.shared_times_used) {
			throw new InvalidCredentialsException();
		}
		if (record.shared_password && !(await argon2.verify(record.shared_password, payload.password))) {
			throw new InvalidCredentialsException();
		}

		await this.knex('directus_shares')
			.update({ times_used: record.shared_times_used + 1 })
			.where('id', record.shared_id);

		const tokenPayload = {
			app_access: false,
			admin_access: false,
			id: record.shared_id,
			role: record.shared_role,
			shared_scope: {
				item: record.shared_item,
				collection: record.shared_collection,
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
		});

		await this.knex('directus_sessions').delete().where('expires', '<', new Date());

		return {
			accessToken,
			refreshToken,
			expires: ms(env.ACCESS_TOKEN_TTL as string),
		};
	}
}
