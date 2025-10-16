import { RELATIONAL_TYPES } from '@directus/constants';
import { ContentVersion, Field, RelationalType, User } from '@directus/types';
import { Revision } from '@/types/revisions';
import { isNil, isEqual, mergeWith } from 'lodash';
import { i18n } from '@/lang';
import { getDefaultValuesFromFields } from '@/utils/get-default-values-from-fields';

export type ComparisonData = {
	base: Record<string, any>;
	incoming: Record<string, any>;
	selectableDeltas?: Revision[] | ContentVersion[];
	comparisonType: 'version' | 'revision';
	outdated?: boolean;
	mainHash?: string;
	currentVersion?: ContentVersion | null;
	initialSelectedDeltaId?: number | string;
};

export type NormalizedUser = {
	id: string;
	firstName: string | null;
	lastName: string | null;
	email: string | null;
	displayName: string;
};

export type NormalizedDate = {
	raw: string | null;
	formatted: string | null;
	dateObject: Date | null;
};

export type NormalizedItem = {
	id: string | number | undefined;
	displayName: string;
	date: NormalizedDate;
	user: NormalizedUser | null;
	collection?: string;
	item?: string | number;
};

export type NormalizedComparisonData = {
	base: NormalizedItem;
	incoming: NormalizedItem;
	selectableDeltas: NormalizedItem[];
	comparisonType: 'version' | 'revision';
	outdated: boolean;
	mainHash: string;
	currentVersion: ContentVersion | null;
	initialSelectedDeltaId: number | string | null;
	fieldsWithDifferences: string[];
	relationalDetails: Record<string, string[]>;
};

export type VersionComparisonResponse = {
	outdated: boolean;
	mainHash: string;
	current: Record<string, any>;
	main: Record<string, any>;
};

export type RevisionComparisonResponse = {
	data: Record<string, any> | null;
	delta: Record<string, any> | null;
	collection: string;
	item: string | number;
	activity: {
		action: string;
		timestamp: string;
		user: any;
	};
};

export type NormalizedComparison = {
	outdated: boolean;
	mainHash: string;
	incoming: Record<string, any>;
	base: Record<string, any>;
};

export function getFieldsWithDifferences(
	comparedData: NormalizedComparison,
	fieldMetadata?: Record<string, any>,
	type?: 'version' | 'revision',
): string[] {
	if (!fieldMetadata) return [];

	const result = calculateFieldDifferences(comparedData.incoming, comparedData.base, fieldMetadata, {
		skipRelationalFields: type === 'revision',
		skipPrimaryKeyFields: true,
	});

	return result.fields;
}

export type FieldDifferencesResult = {
	fields: string[];
	relationalDetails: Record<string, string[]>;
};

export function calculateFieldDifferences(
	revisionData: Record<string, any>,
	currentData: Record<string, any>,
	fieldMetadata: Record<string, any>,
	options: {
		skipRelationalFields?: boolean;
		skipPrimaryKeyFields?: boolean;
	} = {},
): FieldDifferencesResult {
	const { skipRelationalFields = false, skipPrimaryKeyFields = true } = options;
	const differentFields: string[] = [];
	const relationalDetails: Record<string, string[]> = {};

	for (const fieldKey of Object.keys(revisionData)) {
		const field = fieldMetadata[fieldKey];
		if (!field) continue;
		if (skipPrimaryKeyFields && isPrimaryKeyField(field)) continue;

		if (isRelationalField(field)) {
			if (skipRelationalFields) continue;

			const relationalData = revisionData[fieldKey];
			const fieldType = field.meta?.special?.[0];

			if (fieldType === 'm2o') {
				const newValue = revisionData[fieldKey];
				const currentValue = currentData[fieldKey];

				const newId = typeof newValue === 'object' && newValue !== null ? newValue.id : newValue;
				const currentId = typeof currentValue === 'object' && currentValue !== null ? currentValue.id : currentValue;

				if (!isEqual(newId, currentId)) {
					differentFields.push(fieldKey);
				}

				continue;
			}

			if (relationalData && typeof relationalData === 'object' && !Array.isArray(relationalData)) {
				const allChangedIds: (string | number)[] = [];

				if (fieldType === 'o2m') {
					['create', 'update', 'delete'].forEach((op) => {
						if (Array.isArray(relationalData[op])) {
							relationalData[op].forEach((item: any) => {
								if (item?.id) allChangedIds.push(item.id);
							});
						}
					});
				} else if (fieldType === 'm2m' || fieldType === 'm2a') {
					if (Array.isArray(relationalData.delete)) {
						relationalData.delete.forEach((id: any) => {
							if (id !== null && id !== undefined) allChangedIds.push(id);
						});
					}

					if (Array.isArray(relationalData.update)) {
						relationalData.update.forEach((item: any) => {
							if (item?.id) allChangedIds.push(item.id);
						});
					}
				}

				if (allChangedIds.length > 0) {
					differentFields.push(fieldKey);
					relationalDetails[fieldKey] = allChangedIds.map(String);
				}
			}

			continue;
		}

		if (isAutoDateField(field)) continue;

		const newValue = revisionData[fieldKey];
		const currentValue = currentData[fieldKey];

		if (!isEqual(newValue, currentValue)) {
			differentFields.push(fieldKey);
		}
	}

	return { fields: differentFields, relationalDetails };
}

export function getVersionDisplayName(version: ContentVersion): string {
	return isNil(version.name) ? version.key : version.name;
}

export function isRelationalField(field: Field): boolean {
	return field.meta?.special?.find((type) => RELATIONAL_TYPES.includes(type as RelationalType)) !== undefined;
}

export function isAutoDateField(field: Field): boolean {
	return field.meta?.special?.some((type) => type === 'date-created' || type === 'date-updated') ?? false;
}

function isUserReferenceField(field: Field): boolean {
	// Treat system-managed user reference fields like relational for comparison purposes
	return field.meta?.special?.some((type) => type === 'user-created' || type === 'user-updated') ?? false;
}

function isPrimaryKeyField(field: Field): boolean {
	return field.schema?.is_primary_key === true;
}

export function addFieldToSelection(selectedFields: string[], field: string): string[] {
	return [...selectedFields, field];
}

export function removeFieldFromSelection(selectedFields: string[], field: string): string[] {
	return selectedFields.filter((f: string) => f !== field);
}

export function toggleFieldInSelection(selectedFields: string[], field: string): string[] {
	if (selectedFields.includes(field)) {
		return removeFieldFromSelection(selectedFields, field);
	} else {
		return addFieldToSelection(selectedFields, field);
	}
}

export function toggleAllFields(selectedFields: string[], availableFields: string[], allSelected: boolean): string[] {
	if (allSelected) {
		return [];
	} else {
		return [...new Set([...selectedFields, ...availableFields])];
	}
}

export function areAllFieldsSelected(selectedFields: string[], availableFields: string[]): boolean {
	return availableFields.length > 0 && availableFields.every((field) => selectedFields.includes(field));
}

export function areSomeFieldsSelected(selectedFields: string[], availableFields: string[]): boolean {
	return availableFields.length > 0 && availableFields.some((field) => selectedFields.includes(field));
}

export function mergeMainItemKeysIntoRevision(
	revisionData: Record<string, any>,
	mainItem: Record<string, any>,
	fields?: Field[],
): Record<string, any> {
	const merged = { ...revisionData };

	const defaultValues = fields ? getDefaultValuesFromFields(fields).value : {};

	for (const [key] of Object.entries(mainItem)) {
		if (!(key in merged)) {
			const defaultValue = defaultValues[key] ?? null;
			merged[key] = defaultValue;
		}
	}

	return merged;
}

export function copyRelationalFieldsFromBaseToIncoming(
	baseItem: Record<string, any>,
	incomingItem: Record<string, any>,
	fields?: Field[],
): Record<string, any> {
	if (!fields) return incomingItem;

	const result = { ...incomingItem };

	for (const field of fields) {
		if (isRelationalField(field) || isUserReferenceField(field) || isPrimaryKeyField(field)) {
			const fieldKey = field.field;

			if (fieldKey in baseItem) {
				result[fieldKey] = baseItem[fieldKey];
			}
		}
	}

	return result;
}

export function computeDifferentFields(
	comparisonType: 'version' | 'revision',
	base: Record<string, any>,
	incoming: Record<string, any>,
	fields: Field[] = [],
): string[] {
	const replaceArrays = (objValue: any, srcValue: any) => {
		if (Array.isArray(objValue) || Array.isArray(srcValue)) return srcValue;
		return undefined;
	};

	const preparedBase = base || {};
	let preparedIncoming = incoming || {};

	if (comparisonType === 'version') {
		// Modal logic: incoming should be a full item = base + delta
		preparedIncoming = mergeWith({}, preparedBase, preparedIncoming, replaceArrays);

		const fieldMetadata = Object.fromEntries(fields.map((f) => [f.field, f]));
		return calculateFieldDifferences(preparedIncoming, preparedBase, fieldMetadata, {
			skipRelationalFields: false,
			skipPrimaryKeyFields: true,
		}).fields;
	} else {
		const incomingWithDefaults = mergeMainItemKeysIntoRevision(preparedIncoming, preparedBase, fields);
		// 2) Copy relational/user/PK fields from base into incoming
		const incomingWithRelational = copyRelationalFieldsFromBaseToIncoming(preparedBase, incomingWithDefaults, fields);
		const fieldMetadata = Object.fromEntries(fields.map((f) => [f.field, f]));
		return calculateFieldDifferences(incomingWithRelational, preparedBase, fieldMetadata, {
			skipRelationalFields: true,
		}).fields;
	}
}

export function normalizeUser(user: User | string | null | undefined): NormalizedUser | null {
	if (!user) return null;

	// Handle string user ID
	if (typeof user === 'string') {
		return {
			id: user,
			firstName: null,
			lastName: null,
			email: null,
			displayName: i18n.global.t('unknown_user'),
		};
	}

	// Handle full user object
	const firstName = user.first_name || null;
	const lastName = user.last_name || null;
	const email = user.email || null;

	let displayName = i18n.global.t('unknown_user');

	if (firstName && lastName) {
		displayName = `${firstName} ${lastName}`;
	} else if (firstName) {
		displayName = firstName;
	} else if (lastName) {
		displayName = lastName;
	} else if (email) {
		displayName = email;
	}

	return {
		id: user.id,
		firstName,
		lastName,
		email,
		displayName,
	};
}

export function normalizeDate(dateString: string | null | undefined): NormalizedDate {
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

export function normalizeVersionItem(version: ContentVersion): NormalizedItem {
	return {
		id: version.id,
		displayName: getVersionDisplayName(version),
		date: normalizeDate(version.date_updated),
		user: normalizeUser(version.user_updated || version.user_created),
		collection: version.collection,
		item: version.item,
	};
}

export function normalizeRevisionItem(revision: Revision): NormalizedItem {
	const user = revision.activity?.user;
	const timestamp = revision.activity?.timestamp;

	return {
		id: revision.id,
		displayName: i18n.global.t('item_revision'),
		date: normalizeDate(timestamp),
		user: normalizeUser(user as any),
		collection: revision.collection,
		item: revision.item,
	};
}

export function normalizeMainItem(mainData: Record<string, any>): NormalizedItem {
	return {
		id: 'base',
		displayName: i18n.global.t('main_version'),
		date: normalizeDate(mainData.date_updated),
		user: normalizeUser(mainData.user_updated || mainData.user_created),
	};
}

export function normalizeComparisonData(
	comparisonData: ComparisonData,
	fieldMetadata?: Record<string, any>,
): NormalizedComparisonData {
	let base: NormalizedItem;

	if (comparisonData.comparisonType === 'revision' && comparisonData.currentVersion) {
		base = {
			id: 'base',
			displayName: getVersionDisplayName(comparisonData.currentVersion),
			date: normalizeDate(comparisonData.base.date_updated),
			user: normalizeUser(comparisonData.base.user_updated || comparisonData.base.user_created),
		};
	} else {
		base = normalizeMainItem(comparisonData.base);
	}

	let incoming: NormalizedItem;

	if (comparisonData.comparisonType === 'version') {
		const versions = (comparisonData.selectableDeltas as ContentVersion[]) || [];
		const selectedId = (comparisonData.initialSelectedDeltaId as string | undefined) || undefined;
		const selected = selectedId ? versions.find((v) => v.id === selectedId) : versions[0];

		incoming = selected
			? normalizeVersionItem(selected)
			: {
					id: undefined,
					displayName: i18n.global.t('unknown_version'),
					date: { raw: null, formatted: null, dateObject: null },
					user: null,
				};
	} else {
		const revisions = (comparisonData.selectableDeltas as Revision[]) || [];
		const selectedId = (comparisonData.initialSelectedDeltaId as number | undefined) || undefined;
		const selected = typeof selectedId !== 'undefined' ? revisions.find((r) => r.id === selectedId) : revisions[0];

		incoming = selected
			? normalizeRevisionItem(selected)
			: {
					id: undefined,
					displayName: i18n.global.t('unknown_revision'),
					date: { raw: null, formatted: null, dateObject: null },
					user: null,
				};
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

	const fieldDifferencesResult = calculateFieldDifferences(
		normalizedComparison.incoming,
		normalizedComparison.base,
		fieldMetadata || {},
		{
			skipRelationalFields: comparisonData.comparisonType === 'revision',
		},
	);

	return {
		base,
		incoming,
		selectableDeltas,
		comparisonType: comparisonData.comparisonType,
		outdated: comparisonData.outdated || false,
		mainHash: comparisonData.mainHash || '',
		currentVersion: comparisonData.currentVersion || null,
		initialSelectedDeltaId: comparisonData.initialSelectedDeltaId || null,
		fieldsWithDifferences: fieldDifferencesResult.fields,
		relationalDetails: fieldDifferencesResult.relationalDetails,
	};
}

export function isSystemCollection(collection: string): boolean {
	return collection.startsWith('directus_');
}

export function getSystemCollectionEndpoint(collection: string): string | null {
	if (!isSystemCollection(collection)) {
		return null;
	}

	const endpoint = collection.replace('directus_', '/');
	return endpoint;
}

export function getSystemCollectionItemUrl(collection: string, itemId: string | number): string | null {
	const endpoint = getSystemCollectionEndpoint(collection);
	if (!endpoint) return null;

	return `${endpoint}/${itemId}`;
}

export const COMPARISON_SIDES = {
	BASE: 'base' as const,
	INCOMING: 'incoming' as const,
};

export type ComparisonSide = (typeof COMPARISON_SIDES)[keyof typeof COMPARISON_SIDES];
