import database from '../database';
import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
import { nanoid } from 'nanoid';
import ms from 'ms';
import { InvalidCredentialsException } from '../exceptions';
import {
	Session,
	Accountability,
	AbstractServiceOptions,
	AST,
	NestedCollectionAST,
	FieldAST,
	Query,
	Permission,
	Operation,
	Item,
} from '../types';
import Knex from 'knex';
import { ForbiddenException, InvalidPayloadException } from '../exceptions';
import { uniq } from 'lodash';
import generateJoi from '../utils/generate-joi';
import ItemsService from './items';

type AuthenticateOptions = {
	email: string;
	password?: string;
	ip?: string | null;
	userAgent?: string | null;
};

/**
 * Authentication & Authorization
 */
export default class AuthService {
	knex: Knex;
	accountability: Accountability | null;

	constructor(options?: AbstractServiceOptions) {
		this.knex = options?.knex || database;
		this.accountability = options?.accountability || null;
	}

	/**
	 * Retrieve the tokens for a given user email.
	 *
	 * Password is optional to allow usage of this function within the SSO flow and extensions. Make sure
	 * to handle password existence checks elsewhere
	 */
	async authenticate({ email, password, ip, userAgent }: AuthenticateOptions) {
		const user = await database
			.select('id', 'password', 'role')
			.from('directus_users')
			.where({ email })
			.first();

		/** @todo check for status */

		if (!user) {
			throw new InvalidCredentialsException();
		}

		if (password !== undefined && (await argon2.verify(user.password, password)) === false) {
			throw new InvalidCredentialsException();
		}

		const payload = {
			id: user.id,
		};

		/**
		 * @TODO
		 * Sign token with combination of server secret + user password hash
		 * That way, old tokens are immediately invalidated whenever the user changes their password
		 */
		const accessToken = jwt.sign(payload, process.env.SECRET as string, {
			expiresIn: process.env.ACCESS_TOKEN_TTL,
		});

		const refreshToken = nanoid(64);
		const refreshTokenExpiration = new Date(
			Date.now() + ms(process.env.REFRESH_TOKEN_TTL as string)
		);

		await database('directus_sessions').insert({
			token: refreshToken,
			user: user.id,
			expires: refreshTokenExpiration,
			ip,
			user_agent: userAgent,
		});

		return {
			accessToken,
			refreshToken,
			expires: ms(process.env.ACCESS_TOKEN_TTL as string) / 1000,
			id: user.id,
		};
	}

	async refresh(refreshToken: string) {
		if (!refreshToken) {
			throw new InvalidCredentialsException();
		}

		const record = await database
			.select<Session & { email: string }>('directus_sessions.*', 'directus_users.email')
			.from('directus_sessions')
			.where({ 'directus_sessions.token': refreshToken })
			.leftJoin('directus_users', 'directus_sessions.user', 'directus_users.id')
			.first();

		/** @todo
		 * Check if it's worth checking for ip address and/or user agent. We could make this a little
		 * more secure by requiring the refresh token to be used from the same device / location as the
		 * auth session was created in the first place
		 */

		if (!record || !record.email || record.expires < new Date()) {
			throw new InvalidCredentialsException();
		}

		await this.knex.delete().from('directus_sessions').where({ token: refreshToken });

		return await this.authenticate({
			email: record.email,
			ip: record.ip,
			userAgent: record.user_agent,
		});
	}

	async logout(refreshToken: string) {
		await this.knex.delete().from('directus_sessions').where({ token: refreshToken });
	}

	async processAST(ast: AST, operation: Operation = 'read'): Promise<AST> {
		const collectionsRequested = getCollectionsFromAST(ast);

		const permissionsForCollections = await this.knex
			.select<Permission[]>('*')
			.from('directus_permissions')
			.where({ operation, role: this.accountability?.role })
			.whereIn(
				'collection',
				collectionsRequested.map(({ collection }) => collection)
			);

		// If the permissions don't match the collections, you don't have permission to read all of them
		const uniqueCollectionsRequestedCount = uniq(
			collectionsRequested.map(({ collection }) => collection)
		).length;

		if (uniqueCollectionsRequestedCount !== permissionsForCollections.length) {
			// Find the first collection that doesn't have permissions configured
			const { collection, field } = collectionsRequested.find(
				({ collection }) =>
					permissionsForCollections.find(
						(permission) => permission.collection === collection
					) === undefined
			)!;

			if (field) {
				throw new ForbiddenException(
					`You don't have permission to access the "${field}" field.`
				);
			} else {
				throw new ForbiddenException(
					`You don't have permission to access the "${collection}" collection.`
				);
			}
		}

		validateFields(ast);

		applyFilters(ast);

		return ast;

		/**
		 * Traverses the AST and returns an array of all collections that are being fetched
		 */
		function getCollectionsFromAST(
			ast: AST | NestedCollectionAST
		): { collection: string; field: string }[] {
			const collections = [];

			if (ast.type === 'collection') {
				collections.push({
					collection: ast.name,
					field: (ast as NestedCollectionAST).fieldKey
						? (ast as NestedCollectionAST).fieldKey
						: null,
				});
			}

			for (const subAST of ast.children) {
				if (subAST.type === 'collection') {
					collections.push(...getCollectionsFromAST(subAST));
				}
			}

			return collections as { collection: string; field: string }[];
		}

		function validateFields(ast: AST | NestedCollectionAST) {
			if (ast.type === 'collection') {
				const collection = ast.name;

				// We check the availability of the permissions in the step before this is run
				const permissions = permissionsForCollections.find(
					(permission) => permission.collection === collection
				)!;

				const allowedFields = permissions.fields?.split(',') || [];

				for (const childAST of ast.children) {
					if (childAST.type === 'collection') {
						validateFields(childAST);
						continue;
					}

					if (allowedFields.includes('*')) continue;

					const fieldKey = childAST.name;

					if (allowedFields.includes(fieldKey) === false) {
						throw new ForbiddenException(
							`You don't have permission to access the "${fieldKey}" field.`
						);
					}
				}
			}
		}

		function applyFilters(
			ast: AST | NestedCollectionAST | FieldAST
		): AST | NestedCollectionAST | FieldAST {
			if (ast.type === 'collection') {
				const collection = ast.name;

				// We check the availability of the permissions in the step before this is run
				const permissions = permissionsForCollections.find(
					(permission) => permission.collection === collection
				)!;

				ast.query = {
					...ast.query,
					filter: {
						...(ast.query.filter || {}),
						...permissions.permissions,
					},
				};

				if (permissions.limit && ast.query.limit && ast.query.limit > permissions.limit) {
					throw new ForbiddenException(
						`You can't read more than ${permissions.limit} items at a time.`
					);
				}

				// Default to the permissions limit if limit hasn't been set
				if (permissions.limit && !ast.query.limit) {
					ast.query.limit = permissions.limit;
				}

				ast.children = ast.children.map(applyFilters) as (NestedCollectionAST | FieldAST)[];
			}

			return ast;
		}
	}

	async processValues(
		operation: Operation,
		collection: string,
		role: string | null,
		data: Partial<Item>
	) {
		const permission = await this.knex
			.select<Permission>('*')
			.from('directus_permissions')
			.where({ operation, collection, role })
			.first();

		if (!permission) throw new ForbiddenException();

		const allowedFields = permission.fields?.split(',') || [];

		if (allowedFields.includes('*') === false) {
			const keysInData = Object.keys(data);
			const invalidKeys = keysInData.filter(
				(fieldKey) => allowedFields.includes(fieldKey) === false
			);

			if (invalidKeys.length > 0) {
				throw new InvalidPayloadException(`Field "${invalidKeys[0]}" doesn't exist.`);
			}
		}

		const preset = permission.presets || {};

		const payload = {
			...preset,
			...data,
		};

		const schema = generateJoi(permission.permissions);

		const { error } = schema.validate(payload);

		if (error) {
			throw new InvalidPayloadException(error.message);
		}

		return payload;
	}

	async checkAccess(
		operation: Operation,
		collection: string,
		pk: string | number,
		role: string | null
	) {
		const itemsService = new ItemsService(collection, { accountability: { role } });

		try {
			const query: Query = {
				fields: ['*'],
			};

			const result = await itemsService.readByKey(pk, query, operation);

			if (!result) throw '';
		} catch {
			throw new ForbiddenException(
				`You're not allowed to ${operation} item "${pk}" in collection "${collection}".`
			);
		}
	}
}
