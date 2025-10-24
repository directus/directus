import { i18n } from '@/lang';
import type { Revision } from '@/types/revisions';
import { RELATIONAL_TYPES } from '@directus/constants';
import formatTitle from '@directus/format-title';
import type { ContentVersion, Field, RelationalType, User } from '@directus/types';
import { isNil, isEqual } from 'lodash';

export type ComparisonData = {
	base: Record<string, any>;
	incoming: Record<string, any>;
	selectableDeltas?: Revision[] | ContentVersion[];
	revisionFields?: Set<string>;
	comparisonType: 'version' | 'revision';
	outdated?: boolean;
	mainHash?: string;
	currentVersion?: ContentVersion | null;
	initialSelectedDeltaId?: number | string;
};

type NormalizedUser = {
	id: string;
	firstName: string | null;
	lastName: string | null;
	email: string | null;
	displayName: string;
};

type NormalizedDate = {
	raw: string | null;
	formatted: string | null;
	dateObject: Date | null;
};

type NormalizedItem = {
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
	revisionFields?: Set<string>;
	comparisonType: 'version' | 'revision';
	outdated: boolean;
	mainHash: string;
	currentVersion: ContentVersion | null;
	initialSelectedDeltaId: number | string | null;
	fieldsWithDifferences: string[];
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

		if (isPrimaryKeyField(field)) continue;

		if (field.meta?.hidden && isDateCreatedField(field)) continue;
		if (isDateUpdatedField(field)) continue;

		if (field.meta?.hidden && isUserCreatedField(field)) continue;
		if (isUserUpdatedField(field)) continue;

		if (skipRelationalFields && isRelationalField(field)) continue;

		if (!isEqual(incoming[fieldKey], base[fieldKey])) {
			differentFields.push(fieldKey);
		}
	}

	return differentFields;
}

export function applyValuesToSpecialFields(
	fields: Field[],
	incomingItem: Record<string, any>,
	baseItem: Record<string, any>,
	activity: RevisionComparisonResponse['activity'] | undefined,
): Record<string, any> {
	if (!fields) return incomingItem;

	const result: Record<string, any> = {};

	for (const field of fields) {
		const fieldKey = field.field;

		if (activity?.action === 'create' && !incomingItem[fieldKey]) {
			if (isDateCreatedField(field) && activity?.timestamp) {
				if (field.schema?.data_type === 'time') continue;

				result[fieldKey] = activity?.timestamp;
				continue;
			}

			if (isUserCreatedField(field) && activity?.user) {
				result[fieldKey] = activity?.user?.id || activity?.user;
				continue;
			}
		}

		if (isRelationalField(field) || isPrimaryKeyField(field)) {
			if (fieldKey in baseItem) result[fieldKey] = baseItem[fieldKey];
		}
	}

	return result;
}

export function getRevisionFields(revisionFields: string[], fields: Field[]) {
	const filteredFields = revisionFields.filter((fieldKey) => {
		const field = fields.find((field) => field.field === fieldKey);
		if (!field) return false;

		if (field.meta?.hidden && isDateCreatedField(field)) return false;
		if (field.meta?.hidden && isDateUpdatedField(field)) return false;
		if (field.meta?.hidden && isUserCreatedField(field)) return false;
		if (field.meta?.hidden && isUserUpdatedField(field)) return false;

		if (isRelationalField(field)) return false;

		return true;
	});

	const specialFields = fields
		.filter((field) => !filteredFields.includes(field.field))
		.filter((field) => !field.meta?.hidden && (isDateCreatedField(field) || isUserCreatedField(field)))
		.map((field) => field.field);

	return [...filteredFields, ...specialFields];
}

function isRelationalField(field: Field): boolean {
	return field.meta?.special?.find((type) => RELATIONAL_TYPES.includes(type as RelationalType)) !== undefined;
}

function isDateUpdatedField(field: Field): boolean {
	return field.meta?.special?.some((type) => type === 'date-updated') ?? false;
}

function isDateCreatedField(field: Field): boolean {
	return field.meta?.special?.some((type) => type === 'date-created') ?? false;
}

function isUserUpdatedField(field: Field): boolean {
	return field.meta?.special?.some((type) => type === 'user-updated') ?? false;
}

function isUserCreatedField(field: Field): boolean {
	return field.meta?.special?.some((type) => type === 'user-created') ?? false;
}

function isPrimaryKeyField(field: Field): boolean {
	return field.schema?.is_primary_key === true;
}

function addFieldToSelection(selectedFields: string[], field: string): string[] {
	return [...selectedFields, field];
}

function removeFieldFromSelection(selectedFields: string[], field: string): string[] {
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

export function replaceArraysInMergeCustomizer(objValue: unknown, srcValue: unknown) {
	if (Array.isArray(objValue) || Array.isArray(srcValue)) return srcValue;
	return undefined;
}

function normalizeUser(user: User | string | null | undefined): NormalizedUser | null {
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

function normalizeVersionItem(version: ContentVersion): NormalizedItem {
	return {
		id: version.id,
		displayName: getVersionDisplayName(version),
		date: normalizeDate(version.date_updated),
		user: normalizeUser(version.user_updated || version.user_created),
		collection: version.collection,
		item: version.item,
	};
}

function normalizeRevisionItem(revision: Revision): NormalizedItem {
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

function normalizeMainItem(mainData: Record<string, any>): NormalizedItem {
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

export function getVersionDisplayName(version: ContentVersion): string {
	return isNil(version.name) ? formatTitle(version.key) : version.name;
}
