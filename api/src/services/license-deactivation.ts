import { useEnv } from '@directus/env';
import { InvalidPayloadError } from '@directus/errors';
import { isSystemCollection } from '@directus/system-data';
import type { AbstractServiceOptions, Accountability, PrimaryKey } from '@directus/types';
import { toBoolean } from '@directus/utils';
import type { Knex } from 'knex';
import { getSSOState } from '../auth/utils/get-sso-state.js';
import { DEFAULT_AUTH_PROVIDER } from '../constants.js';
import getDatabase from '../database/index.js';
import { clearLicenseFallbackCompliance } from '../license/cache-license-fallback-compliance.js';
import { getExternalAuthProviderNames, hasExternalAuthRuntimeDependencies } from '../license/fallback-compliance.js';
import { getLicenseFallbackEntitlements, toLicenseDeactivationTargetEntitlements } from '../license/fallback.js';
import { getNumericEntitlementLimit } from '../license/numeric-gate.js';
import type {
	LicenseDeactivationApplyPayload,
	LicenseDeactivationApplyResult,
	LicenseDeactivationAssessment,
	LicenseDeactivationBlocker,
	LicenseDeactivationCollectionCandidate,
	LicenseDeactivationSeatCandidate,
	LicenseDeactivationSection,
	LicenseDeactivationSSOSection,
	LicenseDeactivationTargetMode,
	LicenseEntitlements,
} from '../license/types.js';
import type { User } from '../types/auth.js';
import { fetchAccessLookup } from '../utils/fetch-user-count/fetch-access-lookup.js';
import { fetchAccessRoles } from '../utils/fetch-user-count/fetch-access-roles.js';
import { CollectionsService } from './collections.js';
import { SettingsService } from './settings.js';
import { UsersService } from './users.js';

const env = useEnv();

const LICENSE_DEACTIVATION_SECTION_KEYS = {
	collections: 'collections',
	seats: 'seats',
	sso: 'sso',
} as const;

type SeatCandidateGroups = {
	admin_seats: LicenseDeactivationSeatCandidate[];
	user_seats: LicenseDeactivationSeatCandidate[];
};

type SeatCandidateSummary = SeatCandidateGroups & {
	admin_seat_count: number;
	user_seat_count: number;
};

type ExternalAuthUser = Pick<
	User,
	'id' | 'email' | 'password' | 'provider' | 'external_identifier' | 'role' | 'status' | 'first_name' | 'last_name'
> & { auth_data: string | Record<string, unknown> | null; avatar: string | null };

type AssessmentContext = {
	assessment: LicenseDeactivationAssessment;
	collectionCandidates: LicenseDeactivationCollectionCandidate[];
	seatCandidates: SeatCandidateGroups;
	externalAuthUsers: ExternalAuthUser[];
	actingAdmin: ExternalAuthUser;
};

type ResolvedApplyPayload = {
	collections: string[];
	seatIds: string[];
	sso: NonNullable<LicenseDeactivationApplyPayload['sso']> | null;
};

type LicenseDeactivationServiceOptions = AbstractServiceOptions & {
	targetEntitlements?: LicenseEntitlements;
	targetMode?: LicenseDeactivationTargetMode;
};

export class LicenseDeactivationService {
	knex: Knex;
	accountability: Accountability | null;
	schema: AbstractServiceOptions['schema'];
	targetEntitlements: LicenseEntitlements | null;
	targetMode: LicenseDeactivationTargetMode;

	constructor(options: LicenseDeactivationServiceOptions) {
		this.knex = options.knex || getDatabase();
		this.accountability = options.accountability || null;
		this.schema = options.schema;
		this.targetEntitlements = options.targetEntitlements ?? null;
		this.targetMode = options.targetMode ?? 'fallback';
	}

	async assess(): Promise<LicenseDeactivationAssessment> {
		const context = await this.collectAssessmentContext(this.knex);
		return context.assessment;
	}

	async apply(payload: LicenseDeactivationApplyPayload): Promise<LicenseDeactivationApplyResult> {
		const result = await this.knex.transaction(async (trx) => {
			const initial = await this.collectAssessmentContext(trx);

			if (initial.assessment.compliant) {
				return {
					applied: false,
					...initial.assessment,
				};
			}

			const resolvedPayload = this.resolveApplyPayload(payload, initial);

			if (resolvedPayload.collections.length > 0) {
				const collectionsService = new CollectionsService({
					accountability: this.accountability,
					knex: trx,
					schema: this.schema,
				});

				await collectionsService.updateMany(resolvedPayload.collections, {
					meta: {
						excluded: true,
					},
				});
			}

			if (resolvedPayload.seatIds.length > 0) {
				const usersService = new UsersService({
					accountability: this.accountability,
					knex: trx,
					schema: this.schema,
				});

				await usersService.updateMany(resolvedPayload.seatIds, { status: 'deactivated' });
			}

			if (resolvedPayload.sso?.enabled) {
				await this.applyExternalAuthShutdown(trx, resolvedPayload.sso, initial);
			}

			const final = await this.collectAssessmentContext(trx);

			if (final.assessment.compliant !== true) {
				throw new InvalidPayloadError({ reason: 'Remediation did not resolve the current license overages.' });
			}

			return {
				applied: true,
				...final.assessment,
			};
		});

		if (result.applied) {
			try {
				await clearLicenseFallbackCompliance();
			} catch {
				// Ignore cache invalidation failures and preserve the successful remediation.
			}
		}

		return result;
	}

	private resolveApplyPayload(
		payload: LicenseDeactivationApplyPayload,
		context: AssessmentContext,
	): ResolvedApplyPayload {
		const sectionsByKey = new Map(context.assessment.sections.map((section) => [section.key, section]));
		const collectionsSection = sectionsByKey.get(LICENSE_DEACTIVATION_SECTION_KEYS.collections);
		const seatsSection = sectionsByKey.get(LICENSE_DEACTIVATION_SECTION_KEYS.seats);
		const ssoSection = sectionsByKey.get(LICENSE_DEACTIVATION_SECTION_KEYS.sso);

		if (!collectionsSection && payload.collections?.length) {
			throw new InvalidPayloadError({
				reason: 'Collections remediation is not available for the current license state.',
			});
		}

		if (!seatsSection && (payload.seats?.admin_seats?.length || payload.seats?.user_seats?.length)) {
			throw new InvalidPayloadError({ reason: 'Seats remediation is not available for the current license state.' });
		}

		if (!ssoSection && payload.sso) {
			throw new InvalidPayloadError({ reason: 'SSO remediation is not available for the current license state.' });
		}

		this.validateSelections(payload, context);

		return {
			collections: collectionsSection ? uniqueIds(payload.collections) : [],
			seatIds: seatsSection
				? uniqueIds([...(payload.seats?.admin_seats ?? []), ...(payload.seats?.user_seats ?? [])])
				: [],
			sso: ssoSection ? (payload.sso ?? null) : null,
		};
	}

	private async collectAssessmentContext(knex: Knex): Promise<AssessmentContext> {
		const actingAdminId = this.accountability?.user;

		if (!actingAdminId) {
			throw new InvalidPayloadError({ reason: 'An acting admin is required for license remediation.' });
		}

		const targetEntitlements = this.targetEntitlements ?? getLicenseFallbackEntitlements();

		const [collectionCandidates, seatCandidateSummary, externalAuthUsers, actingAdmin, ssoState] = await Promise.all([
			this.getCollectionCandidates(knex),
			this.getSeatCandidates(knex, actingAdminId),
			this.getExternalAuthUsers(knex),
			this.getActingAdmin(knex, actingAdminId),
			getSSOState(knex),
		]);

		const { admin_seat_count, user_seat_count, ...seatCandidates } = seatCandidateSummary;
		const sections: LicenseDeactivationSection[] = [];

		const collectionLimit = getNumericEntitlementLimit(targetEntitlements.collections);
		const collectionCurrent = collectionCandidates.length;
		const collectionReduction = collectionLimit === null ? 0 : Math.max(collectionCurrent - collectionLimit, 0);

		if (collectionLimit !== null && collectionReduction > 0) {
			sections.push({
				key: LICENSE_DEACTIVATION_SECTION_KEYS.collections,
				required: true,
				target: collectionLimit,
				current: collectionCurrent,
				needed_reduction: collectionReduction,
				blockers: [],
				candidates: collectionCandidates,
			});
		}

		const seatsCurrent = admin_seat_count + user_seat_count;
		const seatsLimit = getNumericEntitlementLimit(targetEntitlements.seats);
		const seatsReduction = seatsLimit === null ? 0 : Math.max(seatsCurrent - seatsLimit, 0);

		if (seatsLimit !== null && seatsReduction > 0) {
			sections.push({
				key: LICENSE_DEACTIVATION_SECTION_KEYS.seats,
				required: true,
				target: seatsLimit,
				current: seatsCurrent,
				needed_reduction: seatsReduction,
				blockers: [],
				candidates: seatCandidates,
			});
		}

		const ssoSection = this.buildExternalAuthSection(
			targetEntitlements.sso_enabled,
			ssoState.disabled,
			externalAuthUsers,
			actingAdmin,
		);

		if (ssoSection) {
			sections.push(ssoSection);
		}

		return {
			assessment: {
				compliant: sections.length === 0,
				target_mode: this.targetMode,
				target_entitlements: toLicenseDeactivationTargetEntitlements(targetEntitlements),
				sections,
			},
			collectionCandidates,
			seatCandidates,
			externalAuthUsers,
			actingAdmin,
		};
	}

	private validateSelections(payload: LicenseDeactivationApplyPayload, context: AssessmentContext) {
		for (const section of context.assessment.sections) {
			switch (section.key) {
				case LICENSE_DEACTIVATION_SECTION_KEYS.collections: {
					const selected = uniqueIds(payload.collections);
					const candidateIds = new Set(section.candidates.map((candidate) => candidate.id));

					if (selected.some((id) => candidateIds.has(id) === false)) {
						throw new InvalidPayloadError({
							reason: 'Selected collections must come from the remediation candidates.',
						});
					}

					if (selected.length < section.needed_reduction) {
						throw new InvalidPayloadError({ reason: 'More collections must be selected to reach the allowed limit.' });
					}

					break;
				}

				case LICENSE_DEACTIVATION_SECTION_KEYS.seats: {
					const selectedAdminSeats = uniqueIds(payload.seats?.admin_seats);
					const selectedUserSeats = uniqueIds(payload.seats?.user_seats);
					const validAdminSeats = new Set(section.candidates.admin_seats.map((candidate) => candidate.id));
					const validUserSeats = new Set(section.candidates.user_seats.map((candidate) => candidate.id));

					if (selectedAdminSeats.some((id) => validAdminSeats.has(id) === false)) {
						throw new InvalidPayloadError({
							reason: 'Selected admin seats must come from the remediation candidates.',
						});
					}

					if (selectedUserSeats.some((id) => validUserSeats.has(id) === false)) {
						throw new InvalidPayloadError({ reason: 'Selected user seats must come from the remediation candidates.' });
					}

					if (new Set([...selectedAdminSeats, ...selectedUserSeats]).size < section.needed_reduction) {
						throw new InvalidPayloadError({ reason: 'More seats must be selected to reach the allowed limit.' });
					}

					if ([...selectedAdminSeats, ...selectedUserSeats].includes(context.actingAdmin.id)) {
						throw new InvalidPayloadError({
							reason: 'The acting admin cannot deactivate their own seat in this flow.',
						});
					}

					break;
				}

				case LICENSE_DEACTIVATION_SECTION_KEYS.sso: {
					if (payload.sso?.enabled !== true) {
						throw new InvalidPayloadError({
							reason: 'SSO shutdown must be confirmed before applying this remediation.',
						});
					}

					if (section.blockers.length > 0) {
						throw new InvalidPayloadError({ reason: 'Resolve the SSO blockers before applying this remediation.' });
					}

					if (section.readiness.email_set === false && !payload.sso.email?.trim()) {
						throw new InvalidPayloadError({
							reason: 'The acting admin must provide an email before SSO can be disabled.',
						});
					}

					if (section.readiness.password_set === false && !payload.sso.password?.trim()) {
						throw new InvalidPayloadError({
							reason: 'The acting admin must set a password before SSO can be disabled.',
						});
					}

					break;
				}
			}
		}
	}

	private async applyExternalAuthShutdown(
		knex: Knex,
		payload: NonNullable<LicenseDeactivationApplyPayload['sso']>,
		context: AssessmentContext,
	) {
		const settingsService = new SettingsService({
			accountability: this.accountability,
			knex,
			schema: this.schema,
		});

		const usersService = new UsersService({
			accountability: this.accountability,
			knex,
			schema: this.schema,
		});

		const actingAdminId = context.actingAdmin.id;
		const actingAdminUsesExternalAuth = context.externalAuthUsers.some((user) => user.id === actingAdminId);
		const actingAdminUpdate: Record<string, string | null> = {};

		if (context.actingAdmin.provider !== DEFAULT_AUTH_PROVIDER) {
			actingAdminUpdate['provider'] = DEFAULT_AUTH_PROVIDER;
		}

		if (actingAdminUsesExternalAuth) {
			actingAdminUpdate['auth_data'] = null;
		}

		if (!context.actingAdmin.email && payload.email?.trim()) {
			actingAdminUpdate['email'] = payload.email.trim();
		}

		if (!context.actingAdmin.password && payload.password?.trim()) {
			actingAdminUpdate['password'] = payload.password;
		}

		if (Object.keys(actingAdminUpdate).length > 0) {
			await usersService.updateOne(actingAdminId, actingAdminUpdate);
		}

		const otherExternalAuthUserIds = context.externalAuthUsers
			.map((user) => user.id)
			.filter((userId) => userId !== actingAdminId);

		if (otherExternalAuthUserIds.length > 0) {
			await usersService.updateMany(otherExternalAuthUserIds, {
				provider: DEFAULT_AUTH_PROVIDER,
				auth_data: null,
			});

			await knex('directus_sessions').delete().whereIn('user', otherExternalAuthUserIds);
		}

		if (actingAdminUsesExternalAuth) {
			await knex('directus_sessions')
				.delete()
				.where({ user: actingAdminId })
				.modify((query) => {
					if (this.accountability?.session) {
						query.whereNot('token', this.accountability.session);
					}
				});
		}

		await settingsService.upsertSingleton({ sso_disabled: true });
	}

	private async getCollectionCandidates(knex: Knex): Promise<LicenseDeactivationCollectionCandidate[]> {
		const collections = await knex('directus_collections')
			.select('collection', 'icon', 'excluded')
			.orderBy('collection', 'asc');

		return collections
			.filter(({ collection, excluded }) => !isSystemCollection(collection) && !toBoolean(excluded))
			.map(({ collection, icon }) => ({
				id: collection,
				label: collection,
				icon: icon ?? null,
			}));
	}

	private async getSeatCandidates(knex: Knex, excludedUserId?: PrimaryKey): Promise<SeatCandidateSummary> {
		const [accessRows, activeUsers] = await Promise.all([
			fetchAccessLookup({ knex }),
			knex('directus_users')
				.select('id', 'email', 'first_name', 'last_name', 'avatar', 'role', 'last_access')
				.where({ status: 'active' }),
		]);

		const adminRoles = new Set(
			accessRows.filter((row) => toBoolean(row.admin_access) && row.role !== null).map((row) => row.role!),
		);

		const appRoles = new Set(
			accessRows
				.filter((row) => !toBoolean(row.admin_access) && toBoolean(row.app_access) && row.role !== null)
				.map((row) => row.role!),
		);

		const { adminRoles: allAdminRoles, appRoles: allAppRoles } = await fetchAccessRoles(
			{
				adminRoles,
				appRoles,
			},
			{ knex },
		);

		const directAdminIds = new Set(
			accessRows
				.filter((row) => row.user !== null && row.user_status === 'active' && toBoolean(row.admin_access))
				.map((row) => row.user!),
		);

		const directUserSeatIds = new Set(
			accessRows
				.filter(
					(row) =>
						row.user !== null &&
						row.user_status === 'active' &&
						!toBoolean(row.admin_access) &&
						toBoolean(row.app_access) &&
						allAdminRoles.has(row.user_role ?? '') === false &&
						directAdminIds.has(row.user!) === false,
				)
				.map((row) => row.user!),
		);

		const adminSeats: LicenseDeactivationSeatCandidate[] = [];
		const userSeats: LicenseDeactivationSeatCandidate[] = [];
		let adminSeatCount = 0;
		let userSeatCount = 0;

		for (const user of activeUsers) {
			if (directAdminIds.has(user.id) || allAdminRoles.has(user.role)) {
				adminSeatCount += 1;

				if (excludedUserId !== undefined && user.id === excludedUserId) {
					continue;
				}

				adminSeats.push(toSeatCandidate(user));
				continue;
			}

			if (directUserSeatIds.has(user.id) || allAppRoles.has(user.role)) {
				userSeatCount += 1;

				if (excludedUserId !== undefined && user.id === excludedUserId) {
					continue;
				}

				userSeats.push(toSeatCandidate(user));
			}
		}

		adminSeats.sort(compareSeatCandidates);
		userSeats.sort(compareSeatCandidates);

		return {
			admin_seats: adminSeats,
			user_seats: userSeats,
			admin_seat_count: adminSeatCount,
			user_seat_count: userSeatCount,
		};
	}

	private async getExternalAuthUsers(knex: Knex): Promise<ExternalAuthUser[]> {
		const externalAuthProviderNames = getExternalAuthProviderNames();

		if (externalAuthProviderNames.length === 0) {
			return [];
		}

		return await knex('directus_users')
			.select(
				'id',
				'email',
				'password',
				'provider',
				'external_identifier',
				'auth_data',
				'role',
				'status',
				'first_name',
				'last_name',
				'avatar',
			)
			.whereIn('provider', externalAuthProviderNames)
			.orderBy('first_name', 'asc')
			.orderBy('last_name', 'asc');
	}

	private async getActingAdmin(knex: Knex, actingAdminId: PrimaryKey): Promise<ExternalAuthUser> {
		const actingAdmin = await knex('directus_users')
			.select(
				'id',
				'email',
				'password',
				'provider',
				'external_identifier',
				'auth_data',
				'role',
				'status',
				'first_name',
				'last_name',
				'avatar',
			)
			.where({ id: actingAdminId })
			.first();

		if (!actingAdmin) {
			throw new InvalidPayloadError({ reason: 'The acting admin could not be resolved.' });
		}

		return actingAdmin;
	}

	private buildExternalAuthSection(
		ssoEnabled: boolean,
		ssoDisabled: boolean,
		externalAuthUsers: ExternalAuthUser[],
		actingAdmin: ExternalAuthUser,
	): LicenseDeactivationSSOSection | null {
		if (ssoEnabled === true || ssoDisabled === true) {
			return null;
		}

		const current = hasExternalAuthRuntimeDependencies() || externalAuthUsers.length > 0;

		if (!current) {
			return null;
		}

		const blockers: LicenseDeactivationBlocker[] = [];

		if (toBoolean(env['AUTH_DISABLE_DEFAULT'])) {
			blockers.push({
				code: 'AUTH_DISABLE_DEFAULT',
				resource_id: null,
				next_action: 'Enable the default auth provider before disabling SSO.',
			});
		}

		for (const user of externalAuthUsers) {
			if (user.id === actingAdmin.id) continue;

			if (!user.email) {
				blockers.push({
					code: 'MISSING_EMAIL',
					resource_id: user.id,
					next_action: 'Add an email address so this user can recover access through password reset.',
				});
			}
		}

		return {
			key: LICENSE_DEACTIVATION_SECTION_KEYS.sso,
			required: true,
			target: false,
			current,
			needed_reduction: 1,
			blockers,
			readiness: {
				email_set: Boolean(actingAdmin.email),
				password_set: Boolean(actingAdmin.password),
			},
		};
	}
}

function uniqueIds(ids: string[] | undefined): string[] {
	return Array.from(new Set((ids ?? []).filter((id): id is string => typeof id === 'string' && id.length > 0)));
}

function toSeatCandidate(user: {
	id: string;
	email: string | null;
	first_name: string | null;
	last_name: string | null;
	avatar: string | null;
	last_access: string | Date | null;
}): LicenseDeactivationSeatCandidate {
	return {
		id: user.id,
		email: user.email,
		first_name: user.first_name,
		last_name: user.last_name,
		avatar: user.avatar,
		last_access: user.last_access instanceof Date ? user.last_access.toISOString() : user.last_access,
	};
}

function compareSeatCandidates(a: LicenseDeactivationSeatCandidate, b: LicenseDeactivationSeatCandidate): number {
	const leftAccess = a.last_access ?? null;
	const rightAccess = b.last_access ?? null;
	let accessCompare = 0;

	if (leftAccess === null && rightAccess !== null) {
		accessCompare = -1;
	} else if (leftAccess !== null && rightAccess === null) {
		accessCompare = 1;
	} else if (leftAccess !== null && rightAccess !== null) {
		accessCompare = new Date(leftAccess).getTime() - new Date(rightAccess).getTime();
	}

	if (accessCompare !== 0) return accessCompare;

	const leftLabel = `${a.first_name ?? ''} ${a.last_name ?? ''}`.trim() || a.email || a.id;
	const rightLabel = `${b.first_name ?? ''} ${b.last_name ?? ''}`.trim() || b.email || b.id;
	const nameCompare = leftLabel.localeCompare(rightLabel);

	if (nameCompare !== 0) return nameCompare;

	return a.id.localeCompare(b.id);
}
