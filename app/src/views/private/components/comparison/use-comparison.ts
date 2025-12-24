import api from '@/api';
import { i18n } from '@/lang';
import { useFieldsStore } from '@/stores/fields';
import type { Revision } from '@/types/revisions';
import {
	isDateCreated,
	isDateUpdated,
	isPrimaryKey,
	isRelational,
	isUserCreated,
	isUserUpdated,
} from '@/utils/field-utils';
import { getDefaultValuesFromFields } from '@/utils/get-default-values-from-fields';
import { getRevisionFields } from '@/utils/get-revision-fields';
import { getVersionDisplayName } from '@/utils/get-version-display-name';
import { unexpectedError } from '@/utils/unexpected-error';
import type { ContentVersion, Field, PrimaryKey, User } from '@directus/types';
import { getEndpoint } from '@directus/utils';
import { has, isEqual, mergeWith } from 'lodash';
import { computed, ref, watch, type Ref } from 'vue';
import { useComparisonDiff, isHtmlString } from '@/composables/use-comparison-diff';
import { reconstructComparisonHtml } from '@/utils/reconstruct-comparison-html';
import { shouldShowComparisonDiff } from '@/utils/should-show-comparison-diff';
import type {
	ComparisonData,
	NormalizedComparison,
	NormalizedComparisonData,
	NormalizedDate,
	NormalizedItem,
	VersionComparisonResponse,
} from './types';

interface UseComparisonOptions {
	collection: Ref<string>;
	primaryKey: Ref<PrimaryKey>;
	mode: Ref<'version' | 'revision'>;
	currentVersion: Ref<ContentVersion | null | undefined>;
	currentRevision: Ref<Revision | null | undefined>;
	revisions: Ref<Revision[] | null | undefined>;
}

export function useComparison(options: UseComparisonOptions) {
	const { collection, primaryKey, mode, currentVersion, currentRevision, revisions } = options;

	const selectedComparisonFields = ref<string[]>([]);
	const userUpdated = ref<User | null>(null);
	const baseUserUpdated = ref<User | null>(null);

	const userLoading = ref(false);
	const baseUserLoading = ref(false);
	const fieldsStore = useFieldsStore();

	const comparisonData = ref<ComparisonData | null>(null);

	const normalizedData = computed<NormalizedComparisonData | null>(() => {
		if (!comparisonData.value) return null;

		const collectionFields = fieldsStore.getFieldsForCollection(collection.value);
		const fieldMetadata = Object.fromEntries(collectionFields.map((field) => [field.field, field]));

		return getNormalizedComparisonData(comparisonData.value, fieldMetadata);
	});

	const mainHash = computed(() => normalizedData.value?.mainHash ?? '');

	const fieldsWithDifferences = computed(() => {
		return normalizedData.value?.fieldsWithDifferences || [];
	});

	const allFieldsSelected = computed(
		() =>
			!!fieldsWithDifferences.value.length &&
			fieldsWithDifferences.value.every((field) => selectedComparisonFields.value.includes(field)),
	);

	const someFieldsSelected = computed(
		() =>
			!!fieldsWithDifferences.value.length &&
			fieldsWithDifferences.value.some((field) => selectedComparisonFields.value.includes(field)),
	);

	const availableFieldsCount = computed(() => {
		return fieldsWithDifferences.value.length;
	});

	const comparisonFields = computed(() => {
		return new Set(fieldsWithDifferences.value);
	});

	const baseDisplayName = computed(() => {
		return normalizedData.value?.base?.displayName || '';
	});

	const deltaDisplayName = computed(() => {
		return normalizedData.value?.incoming?.displayName || '';
	});

	watch(
		fieldsWithDifferences,
		(newFields) => {
			if (newFields.length > 0) {
				selectedComparisonFields.value = newFields;
			} else {
				selectedComparisonFields.value = [];
			}
		},
		{ immediate: true },
	);

	return {
		comparisonData,
		selectedComparisonFields,
		userUpdated,
		baseUserUpdated,
		mainHash,
		allFieldsSelected,
		someFieldsSelected,
		availableFieldsCount,
		comparisonFields,
		userLoading,
		baseUserLoading,
		baseDisplayName,
		deltaDisplayName,
		normalizedData,
		toggleSelectAll,
		toggleComparisonField,
		fetchComparisonData,
		fetchUserUpdated,
		fetchBaseItemUserUpdated,
	};

	function toggleSelectAll() {
		if (allFieldsSelected.value) {
			selectedComparisonFields.value = [];
			return;
		}

		selectedComparisonFields.value = [...new Set([...selectedComparisonFields.value, ...fieldsWithDifferences.value])];
	}

	function toggleComparisonField(fieldKey: string) {
		if (selectedComparisonFields.value.includes(fieldKey)) {
			removeFieldFromSelection(fieldKey);
			return;
		}

		addFieldToSelection(fieldKey);
	}

	function addFieldToSelection(fieldKey: string) {
		selectedComparisonFields.value = [...selectedComparisonFields.value, fieldKey];
	}

	function removeFieldFromSelection(fieldKey: string) {
		selectedComparisonFields.value = selectedComparisonFields.value.filter(
			(selectedKey: string) => selectedKey !== fieldKey,
		);
	}

	async function fetchComparisonData() {
		try {
			if (mode.value === 'version' && currentVersion.value) {
				comparisonData.value = await buildVersionComparison(currentVersion.value);
			} else if (mode.value === 'revision' && currentRevision.value) {
				comparisonData.value = await buildRevisionComparison(
					currentRevision.value,
					currentVersion.value,
					revisions.value,
				);
			}
		} catch (error) {
			unexpectedError(error);
		}
	}

	async function fetchUserDetails(user: User | string | null | undefined, loading: Ref<boolean>) {
		if (!user) return;

		const fields = ['id', 'first_name', 'last_name', 'email'];

		if (fields.every((field) => has(user, field))) {
			return user as unknown as User;
		}

		const userId = typeof user === 'string' ? user : user.id;

		loading.value = true;

		try {
			const response = await api.get(`/users/${userId}`, {
				params: { fields },
			});

			return response.data.data;
		} catch (error) {
			unexpectedError(error);
		} finally {
			loading.value = false;
		}
	}

	async function fetchUserUpdated() {
		userUpdated.value = (await fetchUserDetails(normalizedData.value?.incoming?.user, userLoading)) ?? null;
	}

	async function fetchBaseItemUserUpdated() {
		baseUserUpdated.value = (await fetchUserDetails(normalizedData.value?.base?.user, baseUserLoading)) ?? null;
	}

	async function fetchLatestRevisionActivityOfMainVersion(collection: string, item: PrimaryKey) {
		try {
			type RevisionResponse = { data: Pick<Revision, 'activity'>[] };

			const response = await api.get<RevisionResponse>('/revisions', {
				params: {
					filter: {
						_and: [{ collection: { _eq: collection } }, { item: { _eq: item } }, { version: { _null: true } }],
					},
					sort: '-id',
					limit: 1,
					fields: [
						'activity.timestamp',
						'activity.user.id',
						'activity.user.email',
						'activity.user.first_name',
						'activity.user.last_name',
					],
				},
			});

			return response.data.data?.[0]?.activity as ComparisonData['mainVersionMeta'] | undefined;
		} catch (error) {
			unexpectedError(error);
			throw error;
		}
	}

	function processRichTextHtmlFields(
		base: Record<string, any>,
		incoming: Record<string, any>,
		collectionName: string,
	): { base: Record<string, any>; incoming: Record<string, any> } {
		const fields = fieldsStore.getFieldsForCollection(collectionName);

		if (!fields || fields.length === 0) {
			return { base, incoming };
		}

		const { computeDiff } = useComparisonDiff();

		for (const field of fields) {
			if (field.meta?.interface !== 'input-rich-text-html') continue;

			const fieldKey = field.field;
			const baseValue = base[fieldKey];
			const incomingValue = incoming[fieldKey];

			if (baseValue === undefined && incomingValue === undefined) continue;

			if (
				shouldShowComparisonDiff(true, 'base', baseValue, incomingValue) &&
				(isHtmlString(baseValue) || isHtmlString(incomingValue))
			) {
				const changes = computeDiff(baseValue, incomingValue, field);

				if (changes.length > 0) {
					const baseHtml = reconstructComparisonHtml(changes, 'base', false);
					const incomingHtml = reconstructComparisonHtml(changes, 'incoming', false);

					if (baseHtml !== null) {
						base[fieldKey] = baseHtml;
					}

					if (incomingHtml !== null) {
						incoming[fieldKey] = incomingHtml;
					}
				}
			}
		}

		return { base, incoming };
	}

	async function buildVersionComparison(version: ContentVersion): Promise<ComparisonData> {
		try {
			const response = await api.get(`/versions/${version.id}/compare`);
			const data: VersionComparisonResponse = response.data.data;
			const base = data.main || {};
			const incomingMerged = mergeWith({}, base, data.current || {}, replaceArraysInMergeCustomizer);

			const mainVersionMeta = await fetchLatestRevisionActivityOfMainVersion(collection.value, primaryKey.value);

			const { base: processedBase, incoming: processedIncoming } = processRichTextHtmlFields(
				base,
				incomingMerged,
				collection.value,
			);

			return {
				base: processedBase,
				incoming: processedIncoming,
				mainVersionMeta,
				selectableDeltas: [version],
				comparisonType: 'version',
				outdated: data.outdated,
				mainHash: data.mainHash,
				initialSelectedDeltaId: version.id,
			};
		} catch (error) {
			unexpectedError(error);
			throw error;
		}
	}

	async function fetchVersionComparisonForRevision(versionId: string) {
		try {
			const response = await api.get(`/versions/${versionId}/compare`);
			const data: VersionComparisonResponse = response.data.data;
			const main = data.main || {};
			const mainMergedWithVersionLatest = mergeWith({}, main, data.current || {}, replaceArraysInMergeCustomizer);

			return {
				main,
				base: mainMergedWithVersionLatest,
			};
		} catch (error) {
			unexpectedError(error);
			throw error;
		}
	}

	async function fetchMainVersion(collection: string, item: PrimaryKey): Promise<Record<string, any>> {
		const endpoint = getEndpoint(collection);
		const itemEndpoint = `${endpoint}/${item}`;

		try {
			const itemResponse = await api.get(itemEndpoint);
			return itemResponse.data?.data || {};
		} catch (error) {
			unexpectedError(error);
			throw error;
		}
	}

	async function buildRevisionComparison(
		revision: Revision,
		currentVersion: ContentVersion | null | undefined,
		revisions: Revision[] | null | undefined,
	): Promise<ComparisonData> {
		let base: Record<string, any> = {};
		let incoming = revision.data || {};
		const activity = revision?.activity;
		const revisionsList = revisions || [];
		const revisionId = 'id' in revision ? revision.id : null;
		const targetCollection = revision.collection || collection.value || '';
		const fields = fieldsStore.getFieldsForCollection(targetCollection);
		const revisionDelta = Object.keys(revision.delta ?? {});
		const revisionFields = new Set(getRevisionFields(revisionDelta, fields));

		if (currentVersion) {
			const versionComparison = await fetchVersionComparisonForRevision(currentVersion.id);
			base = versionComparison.base;
			incoming = mergeWith({}, versionComparison.main, incoming, replaceArraysInMergeCustomizer);
		} else if ('collection' in revision && 'item' in revision) {
			const { collection, item } = revision as { collection: string; item: string | number };
			base = await fetchMainVersion(collection, item);
			const defaultValues = getDefaultValuesFromFields(fields).value;
			incoming = mergeWith({}, defaultValues, incoming, replaceArraysInMergeCustomizer);
		}

		// Revisions do not support relational fields. Therefore, we merge these fields, as well as the primary key, from the base into the incoming object. For date_created and user_created, we populate them from the activity if available.
		const specialFields = applyValuesToSpecialFields(fields, incoming, base, activity);
		incoming = mergeWith({}, incoming, specialFields, replaceArraysInMergeCustomizer);

		const { base: processedBase, incoming: processedIncoming } = processRichTextHtmlFields(
			base,
			incoming,
			targetCollection,
		);

		return {
			base: processedBase,
			incoming: processedIncoming,
			selectableDeltas: revisionsList,
			revisionFields,
			comparisonType: 'revision',
			outdated: false,
			mainHash: '',
			currentVersion: currentVersion || null,
			initialSelectedDeltaId: revisionId || undefined,
		};
	}

	function applyValuesToSpecialFields(
		fields: Field[],
		incomingItem: Record<string, any>,
		baseItem: Record<string, any>,
		activity: Revision['activity'] | undefined,
	): Record<string, any> {
		if (!fields) return incomingItem;

		const result: Record<string, any> = {};

		for (const field of fields) {
			const fieldKey = field.field;

			if (activity?.action === 'create' && !incomingItem[fieldKey]) {
				if (isDateCreated(field) && activity?.timestamp) {
					if (field.schema?.data_type === 'time') continue;

					result[fieldKey] = activity?.timestamp;
					continue;
				}

				if (isUserCreated(field) && activity?.user) {
					result[fieldKey] = typeof activity.user === 'object' ? activity.user.id : activity.user;
					continue;
				}
			}

			if (isRelational(field) || isPrimaryKey(field)) {
				if (fieldKey in baseItem) result[fieldKey] = baseItem[fieldKey];
			}
		}

		return result;
	}

	function getNormalizedComparisonData(
		comparisonData: ComparisonData,
		fieldMetadata: Record<string, any>,
	): NormalizedComparisonData {
		let base: NormalizedItem;

		if (comparisonData.comparisonType === 'revision') {
			const revisions = (comparisonData.selectableDeltas as Revision[]) || [];
			const latestRevision = revisions?.[0] ?? null;
			const { date, user } = getNormalizedDateAndUser(latestRevision);

			const displayName = getVersionDisplayName(comparisonData.currentVersion ?? null);

			base = { id: 'base', displayName, date, user };
		} else {
			base = {
				id: 'base',
				displayName: i18n.global.t('main_version'),
				date: normalizeDate(comparisonData.mainVersionMeta?.timestamp || comparisonData.base.date_updated),
				user:
					comparisonData.mainVersionMeta?.user ?? comparisonData.base.user_updated ?? comparisonData.base.user_created,
			};
		}

		let incoming: NormalizedItem;

		if (comparisonData.comparisonType === 'version') {
			const versions = (comparisonData.selectableDeltas as ContentVersion[]) || [];
			const selectedId = (comparisonData.initialSelectedDeltaId as string | undefined) || undefined;
			const selected = selectedId ? versions.find((v) => v.id === selectedId) : versions[0];

			incoming = normalizeVersionItem(selected);
		} else {
			const revisions = (comparisonData.selectableDeltas as Revision[]) || [];
			const selectedId = (comparisonData.initialSelectedDeltaId as number | undefined) || undefined;
			const selected = typeof selectedId !== 'undefined' ? revisions.find((r) => r.id === selectedId) : revisions[0];

			incoming = normalizeRevisionItem(selected);
		}

		const selectableDeltas: NormalizedItem[] = (comparisonData.selectableDeltas || []).map((item) => {
			if (comparisonData.comparisonType === 'version') {
				return normalizeVersionItem(item as ContentVersion);
			} else {
				return normalizeRevisionItem(item as Revision);
			}
		});

		const normalizedComparison = {
			outdated: comparisonData.outdated || false,
			mainHash: comparisonData.mainHash || '',
			incoming: comparisonData.incoming,
			base: comparisonData.base,
		};

		const fieldsWithDifferences = getFieldsWithDifferences(
			normalizedComparison,
			fieldMetadata,
			comparisonData.comparisonType,
		);

		return {
			base,
			incoming,
			selectableDeltas,
			revisionFields: comparisonData.revisionFields,
			comparisonType: comparisonData.comparisonType,
			outdated: comparisonData.outdated || false,
			mainHash: comparisonData.mainHash || '',
			currentVersion: comparisonData.currentVersion || null,
			initialSelectedDeltaId: comparisonData.initialSelectedDeltaId || null,
			fieldsWithDifferences,
		};
	}

	function getFieldsWithDifferences(
		comparedData: NormalizedComparison,
		fieldMetadata?: Record<string, any>,
		type?: 'version' | 'revision',
	): string[] {
		if (!fieldMetadata) return [];

		return calculateFieldDifferences(comparedData.incoming, comparedData.base, fieldMetadata, type === 'revision');
	}

	function calculateFieldDifferences(
		incoming: Record<string, any>,
		base: Record<string, any>,
		fieldMetadata: Record<string, any>,
		skipRelationalFields: boolean,
	): string[] {
		const differentFields: string[] = [];

		for (const fieldKey of Object.keys(incoming)) {
			const field = fieldMetadata[fieldKey];
			if (!field) continue;

			if (isPrimaryKey(field)) continue;

			if (field.meta?.hidden && isDateCreated(field)) continue;
			if (isDateUpdated(field)) continue;

			if (field.meta?.hidden && isUserCreated(field)) continue;
			if (isUserUpdated(field)) continue;

			if (skipRelationalFields && isRelational(field)) continue;

			if (!isEqual(incoming[fieldKey], base[fieldKey])) {
				differentFields.push(fieldKey);
			}
		}

		return differentFields;
	}

	function normalizeVersionItem(version: ContentVersion | undefined): NormalizedItem {
		if (!version) {
			return {
				id: undefined,
				displayName: i18n.global.t('unknown_version'),
				date: normalizeDate(null),
				user: null,
			};
		}

		return {
			id: version.id,
			displayName: getVersionDisplayName(version),
			// we use date_updated only when user_updated exists; during version creation, the engine sets date_updated using an incorrect format, so we use date_created instead
			date: normalizeDate(version.user_updated ? version.date_updated : version.date_created),
			user: version.user_updated ?? version.user_created,
			collection: version.collection,
			item: version.item,
		};
	}

	function normalizeRevisionItem(revision: Revision | undefined): NormalizedItem {
		const { date, user } = getNormalizedDateAndUser(revision);

		if (!revision) {
			return {
				id: undefined,
				displayName: i18n.global.t('unknown_revision'),
				date,
				user,
			};
		}

		return {
			id: revision.id,
			displayName: i18n.global.t('item_revision'),
			date,
			user,
			collection: revision.collection,
			item: revision.item,
		};
	}

	function getNormalizedDateAndUser(revision: Revision | null | undefined): Pick<NormalizedItem, 'date' | 'user'> {
		const user = revision?.activity?.user as User | string | null | undefined;
		const timestamp = revision?.activity?.timestamp;

		return {
			date: normalizeDate(timestamp),
			user: user,
		};
	}

	function normalizeDate(dateString: string | null | undefined): NormalizedDate {
		if (!dateString) {
			return {
				raw: null,
				formatted: null,
				dateObject: null,
			};
		}

		const dateObject = new Date(dateString);
		const isValid = !isNaN(dateObject.getTime());

		return {
			raw: dateString,
			formatted: isValid ? dateString : null,
			dateObject: isValid ? dateObject : null,
		};
	}

	function replaceArraysInMergeCustomizer(objValue: unknown, srcValue: unknown) {
		if (Array.isArray(objValue) || Array.isArray(srcValue)) return srcValue;
		return undefined;
	}
}
