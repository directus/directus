import { useEnv } from '@directus/env';
import { ErrorCode, ForbiddenError, InvalidPayloadError, isDirectusError } from '@directus/errors';
import type { Accountability, GraphQLParams } from '@directus/types';
import argon2 from 'argon2';
import {
	GraphQLBoolean,
	GraphQLEnumType,
	GraphQLID,
	GraphQLInt,
	GraphQLNonNull,
	GraphQLObjectType,
	GraphQLString,
} from 'graphql';
import { SchemaComposer } from 'graphql-compose';
import { clearSystemCache, getCache } from '../../../cache.js';
import { DEFAULT_AUTH_PROVIDER, REFRESH_COOKIE_OPTIONS, SESSION_COOKIE_OPTIONS } from '../../../constants.js';
import { rateLimiter } from '../../../middleware/rate-limiter-registration.js';
import { createDefaultAccountability } from '../../../permissions/utils/create-default-accountability.js';
import type { AuthenticationMode } from '../../../types/index.js';
import { generateHash } from '../../../utils/generate-hash.js';
import { getIPFromReq } from '../../../utils/get-ip-from-req.js';
import { getSecret } from '../../../utils/get-secret.js';
import isDirectusJWT from '../../../utils/is-directus-jwt.js';
import { verifyAccessJWT } from '../../../utils/jwt.js';
import { AuthenticationService } from '../../authentication.js';
import { RevisionsService } from '../../revisions.js';
import { TFAService } from '../../tfa.js';
import { UsersService } from '../../users.js';
import { UtilsService } from '../../utils.js';
import { GraphQLService } from '../index.js';
import { GraphQLBigInt } from '../types/bigint.js';
import { GraphQLVoid } from '../types/void.js';

const env = useEnv();

/**
 * Globally available mutations
 */
export function globalResolvers(gql: GraphQLService, schemaComposer: SchemaComposer<GraphQLParams['contextValue']>) {
	const AuthTokens = schemaComposer.createObjectTC({
		name: 'auth_tokens',
		fields: {
			access_token: GraphQLString,
			expires: GraphQLBigInt,
			refresh_token: GraphQLString,
		},
	});

	const AuthMode = new GraphQLEnumType({
		name: 'auth_mode',
		values: {
			json: { value: 'json' },
			cookie: { value: 'cookie' },
			session: { value: 'session' },
		},
	});

	schemaComposer.Mutation.addFields({
		auth_login: {
			type: AuthTokens,
			args: {
				email: new GraphQLNonNull(GraphQLString),
				password: new GraphQLNonNull(GraphQLString),
				mode: AuthMode,
				otp: GraphQLString,
			},
			resolve: async (_, args, { req, res }) => {
				const accountability: Accountability = createDefaultAccountability();

				if (req?.ip) accountability.ip = req.ip;

				const userAgent = req?.get('user-agent');
				if (userAgent) accountability.userAgent = userAgent;

				const origin = req?.get('origin');
				if (origin) accountability.origin = origin;

				const authenticationService = new AuthenticationService({
					accountability: accountability,
					schema: gql.schema,
				});

				const mode: AuthenticationMode = args['mode'] ?? 'json';

				const { accessToken, refreshToken, expires } = await authenticationService.login(DEFAULT_AUTH_PROVIDER, args, {
					session: mode === 'session',
					otp: args?.otp,
				});

				const payload = { expires } as { expires: number; access_token?: string; refresh_token?: string };

				if (mode === 'json') {
					payload.refresh_token = refreshToken;
					payload.access_token = accessToken;
				}

				if (mode === 'cookie') {
					res?.cookie(env['REFRESH_TOKEN_COOKIE_NAME'] as string, refreshToken, REFRESH_COOKIE_OPTIONS);
					payload.access_token = accessToken;
				}

				if (mode === 'session') {
					res?.cookie(env['SESSION_COOKIE_NAME'] as string, accessToken, SESSION_COOKIE_OPTIONS);
				}

				return payload;
			},
		},
		auth_refresh: {
			type: AuthTokens,
			args: {
				refresh_token: GraphQLString,
				mode: AuthMode,
			},
			resolve: async (_, args, { req, res }) => {
				const accountability: Accountability = createDefaultAccountability();

				if (req?.ip) accountability.ip = req.ip;

				const userAgent = req?.get('user-agent');
				if (userAgent) accountability.userAgent = userAgent;

				const origin = req?.get('origin');
				if (origin) accountability.origin = origin;

				const authenticationService = new AuthenticationService({
					accountability: accountability,
					schema: gql.schema,
				});

				const mode: AuthenticationMode = args['mode'] ?? 'json';
				let currentRefreshToken: string | undefined;

				if (mode === 'json') {
					currentRefreshToken = args['refresh_token'];
				} else if (mode === 'cookie') {
					currentRefreshToken = req?.cookies[env['REFRESH_TOKEN_COOKIE_NAME'] as string];
				} else if (mode === 'session') {
					const token = req?.cookies[env['SESSION_COOKIE_NAME'] as string];

					if (isDirectusJWT(token)) {
						const payload = verifyAccessJWT(token, getSecret());
						currentRefreshToken = payload.session;
					}
				}

				if (!currentRefreshToken) {
					throw new InvalidPayloadError({
						reason: `The refresh token is required in either the payload or cookie`,
					});
				}

				const { accessToken, refreshToken, expires } = await authenticationService.refresh(currentRefreshToken, {
					session: mode === 'session',
				});

				const payload = { expires } as { expires: number; access_token?: string; refresh_token?: string };

				if (mode === 'json') {
					payload.refresh_token = refreshToken;
					payload.access_token = accessToken;
				}

				if (mode === 'cookie') {
					res?.cookie(env['REFRESH_TOKEN_COOKIE_NAME'] as string, refreshToken, REFRESH_COOKIE_OPTIONS);
					payload.access_token = accessToken;
				}

				if (mode === 'session') {
					res?.cookie(env['SESSION_COOKIE_NAME'] as string, accessToken, SESSION_COOKIE_OPTIONS);
				}

				return payload;
			},
		},
		auth_logout: {
			type: GraphQLBoolean,
			args: {
				refresh_token: GraphQLString,
				mode: AuthMode,
			},
			resolve: async (_, args, { req, res }) => {
				const accountability: Accountability = createDefaultAccountability();

				if (req?.ip) accountability.ip = req.ip;

				const userAgent = req?.get('user-agent');
				if (userAgent) accountability.userAgent = userAgent;

				const origin = req?.get('origin');
				if (origin) accountability.origin = origin;

				const authenticationService = new AuthenticationService({
					accountability: accountability,
					schema: gql.schema,
				});

				const mode: AuthenticationMode = args['mode'] ?? 'json';
				let currentRefreshToken: string | undefined;

				if (mode === 'json') {
					currentRefreshToken = args['refresh_token'];
				} else if (mode === 'cookie') {
					currentRefreshToken = req?.cookies[env['REFRESH_TOKEN_COOKIE_NAME'] as string];
				} else if (mode === 'session') {
					const token = req?.cookies[env['SESSION_COOKIE_NAME'] as string];

					if (isDirectusJWT(token)) {
						const payload = verifyAccessJWT(token, getSecret());
						currentRefreshToken = payload.session;
					}
				}

				if (!currentRefreshToken) {
					throw new InvalidPayloadError({
						reason: `The refresh token is required in either the payload or cookie`,
					});
				}

				await authenticationService.logout(currentRefreshToken);

				if (req?.cookies[env['REFRESH_TOKEN_COOKIE_NAME'] as string]) {
					res?.clearCookie(env['REFRESH_TOKEN_COOKIE_NAME'] as string, REFRESH_COOKIE_OPTIONS);
				}

				if (req?.cookies[env['SESSION_COOKIE_NAME'] as string]) {
					res?.clearCookie(env['SESSION_COOKIE_NAME'] as string, SESSION_COOKIE_OPTIONS);
				}

				return true;
			},
		},
		auth_password_request: {
			type: GraphQLBoolean,
			args: {
				email: new GraphQLNonNull(GraphQLString),
				reset_url: GraphQLString,
			},
			resolve: async (_, args, { req }) => {
				const accountability: Accountability = createDefaultAccountability();

				if (req?.ip) accountability.ip = req.ip;

				const userAgent = req?.get('user-agent');
				if (userAgent) accountability.userAgent = userAgent;

				const origin = req?.get('origin');
				if (origin) accountability.origin = origin;
				const service = new UsersService({ accountability, schema: gql.schema });

				try {
					await service.requestPasswordReset(args['email'], args['reset_url'] || null);
				} catch (err: any) {
					if (isDirectusError(err, ErrorCode.InvalidPayload)) {
						throw err;
					}
				}

				return true;
			},
		},
		auth_password_reset: {
			type: GraphQLBoolean,
			args: {
				token: new GraphQLNonNull(GraphQLString),
				password: new GraphQLNonNull(GraphQLString),
			},
			resolve: async (_, args, { req }) => {
				const accountability: Accountability = createDefaultAccountability();

				if (req?.ip) accountability.ip = req.ip;

				const userAgent = req?.get('user-agent');
				if (userAgent) accountability.userAgent = userAgent;

				const origin = req?.get('origin');
				if (origin) accountability.origin = origin;

				const service = new UsersService({ accountability, schema: gql.schema });
				await service.resetPassword(args['token'], args['password']);
				return true;
			},
		},
		users_me_tfa_generate: {
			type: new GraphQLObjectType({
				name: 'users_me_tfa_generate_data',
				fields: {
					secret: { type: GraphQLString },
					otpauth_url: { type: GraphQLString },
				},
			}),
			args: {
				password: new GraphQLNonNull(GraphQLString),
			},
			resolve: async (_, args) => {
				if (!gql.accountability?.user) return null;

				const service = new TFAService({
					accountability: gql.accountability,
					schema: gql.schema,
				});

				const authService = new AuthenticationService({
					accountability: gql.accountability,
					schema: gql.schema,
				});

				await authService.verifyPassword(gql.accountability.user, args['password']);
				const { url, secret } = await service.generateTFA(gql.accountability.user);
				return { secret, otpauth_url: url };
			},
		},
		users_me_tfa_enable: {
			type: GraphQLBoolean,
			args: {
				otp: new GraphQLNonNull(GraphQLString),
				secret: new GraphQLNonNull(GraphQLString),
			},
			resolve: async (_, args) => {
				if (!gql.accountability?.user) return null;

				const service = new TFAService({
					accountability: gql.accountability,
					schema: gql.schema,
				});

				await service.enableTFA(gql.accountability.user, args['otp'], args['secret']);
				return true;
			},
		},
		users_me_tfa_disable: {
			type: GraphQLBoolean,
			args: {
				otp: new GraphQLNonNull(GraphQLString),
			},
			resolve: async (_, args) => {
				if (!gql.accountability?.user) return null;

				const service = new TFAService({
					accountability: gql.accountability,
					schema: gql.schema,
				});

				const otpValid = await service.verifyOTP(gql.accountability.user, args['otp']);

				if (otpValid === false) {
					throw new InvalidPayloadError({ reason: `"otp" is invalid` });
				}

				await service.disableTFA(gql.accountability.user);
				return true;
			},
		},
		utils_random_string: {
			type: GraphQLString,
			args: {
				length: GraphQLInt,
			},
			resolve: async (_, args) => {
				const { nanoid } = await import('nanoid');

				if (args['length'] !== undefined && (args['length'] < 1 || args['length'] > 500)) {
					throw new InvalidPayloadError({ reason: `"length" must be between 1 and 500` });
				}

				return nanoid(args['length'] ? args['length'] : 32);
			},
		},
		utils_hash_generate: {
			type: GraphQLString,
			args: {
				string: new GraphQLNonNull(GraphQLString),
			},
			resolve: async (_, args) => {
				return await generateHash(args['string']);
			},
		},
		utils_hash_verify: {
			type: GraphQLBoolean,
			args: {
				string: new GraphQLNonNull(GraphQLString),
				hash: new GraphQLNonNull(GraphQLString),
			},
			resolve: async (_, args) => {
				return await argon2.verify(args['hash'], args['string']);
			},
		},
		utils_sort: {
			type: GraphQLBoolean,
			args: {
				collection: new GraphQLNonNull(GraphQLString),
				item: new GraphQLNonNull(GraphQLID),
				to: new GraphQLNonNull(GraphQLID),
			},
			resolve: async (_, args) => {
				const service = new UtilsService({
					accountability: gql.accountability,
					schema: gql.schema,
				});

				const { item, to } = args;
				await service.sort(args['collection'], { item, to });
				return true;
			},
		},
		utils_revert: {
			type: GraphQLBoolean,
			args: {
				revision: new GraphQLNonNull(GraphQLID),
			},
			resolve: async (_, args) => {
				const service = new RevisionsService({
					accountability: gql.accountability,
					schema: gql.schema,
				});

				await service.revert(args['revision']);
				return true;
			},
		},
		utils_cache_clear: {
			type: GraphQLVoid,
			resolve: async () => {
				if (gql.accountability?.admin !== true) {
					throw new ForbiddenError();
				}

				const { cache } = getCache();

				await cache?.clear();
				await clearSystemCache();

				return;
			},
		},
		users_invite_accept: {
			type: GraphQLBoolean,
			args: {
				token: new GraphQLNonNull(GraphQLString),
				password: new GraphQLNonNull(GraphQLString),
			},
			resolve: async (_, args) => {
				const service = new UsersService({
					accountability: gql.accountability,
					schema: gql.schema,
				});

				await service.acceptInvite(args['token'], args['password']);
				return true;
			},
		},
		users_register: {
			type: GraphQLBoolean,
			args: {
				email: new GraphQLNonNull(GraphQLString),
				password: new GraphQLNonNull(GraphQLString),
				verification_url: GraphQLString,
				first_name: GraphQLString,
				last_name: GraphQLString,
			},
			resolve: async (_, args, { req }) => {
				const service = new UsersService({ accountability: null, schema: gql.schema });

				const ip = req ? getIPFromReq(req) : null;

				if (ip) {
					await rateLimiter.consume(ip);
				}

				await service.registerUser({
					email: args.email,
					password: args.password,
					verification_url: args.verification_url,
					first_name: args.first_name,
					last_name: args.last_name,
				});

				return true;
			},
		},
		users_register_verify: {
			type: GraphQLBoolean,
			args: {
				token: new GraphQLNonNull(GraphQLString),
			},
			resolve: async (_, args) => {
				const service = new UsersService({ accountability: null, schema: gql.schema });
				await service.verifyRegistration(args.token);
				return true;
			},
		},
	});
}
