import AuthService from './authentication';
import ItemsService from './items';
import jwt from 'jsonwebtoken';
import { sendInviteMail } from '../mail';
import database from '../database';
import argon2 from 'argon2';
import { InvalidPayloadException } from '../exceptions';
import { Accountability, Query, Item, AbstractServiceOptions } from '../types';
import Knex from 'knex';
import env from '../env';

export default class UsersService extends ItemsService {
	knex: Knex;
	accountability: Accountability | null;
	service: ItemsService;

	constructor(options?: AbstractServiceOptions) {
		super('directus_users', options);

		this.knex = options?.knex || database;
		this.accountability = options?.accountability || null;
		this.service = new ItemsService('directus_users', options);
	}

	async inviteUser(email: string, role: string) {
		await this.service.create({ email, role, status: 'invited' });

		const payload = { email };
		const token = jwt.sign(payload, env.SECRET as string, { expiresIn: '7d' });
		const acceptURL = env.PUBLIC_URL + '/admin/accept-invite?token=' + token;

		await sendInviteMail(email, acceptURL);
	}

	async acceptInvite(token: string, password: string) {
		const { email } = jwt.verify(token, env.SECRET as string) as { email: string };

		const user = await database
			.select('id', 'status')
			.from('directus_users')
			.where({ email })
			.first();

		if (!user || user.status !== 'invited') {
			throw new InvalidPayloadException(`Email address ${email} hasn't been invited.`);
		}

		const passwordHashed = await argon2.hash(password);

		await database('directus_users')
			.update({ password: passwordHashed, status: 'active' })
			.where({ id: user.id });
	}

	async enableTFA(pk: string) {
		const user = await this.knex.select('tfa_secret').from('directus_users').where({ id: pk }).first();

		if (user?.tfa_secret !== null) {
			throw new Error('TFA Secret is already set for this user');
		}

		const authService = new AuthService();
		const secret = authService.generateTFASecret();

		await this.knex('directus_users').update({ tfa_secret: secret }).where({ id: pk });

		return await authService.generateOTPAuthURL(secret);
	}
}
