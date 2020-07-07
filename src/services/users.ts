import { Query } from '../types/query';
import * as ItemsService from './items';
import jwt from 'jsonwebtoken';
import { sendInviteMail } from '../mail';
import database from '../database';
import argon2 from 'argon2';
import * as PayloadService from '../services/payload';
import { InvalidPayloadException } from '../exceptions';

export const createUser = async (data: Record<string, any>, query?: Query) => {
	const payload = await PayloadService.processValues('create', 'directus_users', data);
	return await ItemsService.createItem('directus_users', payload, query);
};

export const readUsers = async (query?: Query) => {
	return await ItemsService.readItems('directus_users', query);
};

export const readUser = async (pk: string | number, query?: Query) => {
	return await ItemsService.readItem('directus_users', pk, query);
};

export const updateUser = async (pk: string | number, data: Record<string, any>, query?: Query) => {
	/**
	 * @todo
	 * Remove "other" refresh token sessions when changing password to enforce "logout everywhere" on password change
	 *
	 * Maybe make this an option?
	 */
	return await ItemsService.updateItem('directus_users', pk, data, query);
};

export const deleteUser = async (pk: string | number) => {
	await ItemsService.deleteItem('directus_users', pk);
};

export const inviteUser = async (email: string, role: string) => {
	const userPayload = await PayloadService.processValues('create', 'directus_users', {
		email,
		role,
		status: 'invited',
	});
	await createUser(userPayload);

	const payload = { email };
	const token = jwt.sign(payload, process.env.SECRET, { expiresIn: '7d' });
	const acceptURL = process.env.PUBLIC_URL + '/admin/accept-invite?token=' + token;

	await sendInviteMail(email, acceptURL);
};

export const acceptInvite = async (token: string, password: string) => {
	const { email } = jwt.verify(token, process.env.SECRET) as Record<string, any>;
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
};
