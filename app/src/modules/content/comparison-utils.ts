import { ContentVersion, User } from '@directus/types';
import { Revision } from '@/types/revisions';
import { isNil, isEqual } from 'lodash';
import { i18n } from '@/lang';

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
	id: string | number;
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
): string[] {
	return Object.keys(comparedData.incoming).filter((fieldKey) => {
		// Skip read-only fields. Even if they are different, they cannot be edited, so there is no point in showing them.
		if (fieldMetadata && fieldMetadata[fieldKey]?.meta?.readonly === true) {
			return false;
		}

		const incomingValue = comparedData.incoming[fieldKey];
		const baseValue = comparedData.base[fieldKey];

		if (fieldKey === 'date_updated') {
			const baseMs = baseValue ? new Date(baseValue as any).getTime() : null;
			const incomingMs = incomingValue ? new Date(incomingValue as any).getTime() : null;

			if (baseMs === null || incomingMs === null || Number.isNaN(baseMs) || Number.isNaN(incomingMs)) {
				return !isEqual(incomingValue, baseValue);
			}

			// Looks like these values are written at slightly different times, so we need to compare them at the second level
			// instead of the millisecond level
			const baseSec = Math.floor(baseMs / 1000);
			const incomingSec = Math.floor(incomingMs / 1000);
			return baseSec !== incomingSec;
		}

		return !isEqual(incomingValue, baseValue);
	});
}

export function getVersionDisplayName(version: ContentVersion): string {
	return isNil(version.name) ? version.key : version.name;
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

export function normalizeUser(user: User | string | null | undefined): NormalizedUser | null {
	if (!user) return null;

	// Handle string user ID
	if (typeof user === 'string') {
		return {
			id: user,
			firstName: null,
			lastName: null,
			email: null,
			displayName: 'Unknown User',
		};
	}

	// Handle full user object
	const firstName = user.first_name || null;
	const lastName = user.last_name || null;
	const email = user.email || null;

	let displayName = 'Unknown User';

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
		displayName: 'Main',
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
					id: 'unknown',
					displayName: 'Unknown Version',
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
					id: 'unknown',
					displayName: 'Unknown Revision',
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

	const fieldsWithDifferences = getFieldsWithDifferences(normalizedComparison, fieldMetadata);

	return {
		base,
		incoming,
		selectableDeltas,
		comparisonType: comparisonData.comparisonType,
		outdated: comparisonData.outdated || false,
		mainHash: comparisonData.mainHash || '',
		currentVersion: comparisonData.currentVersion || null,
		initialSelectedDeltaId: comparisonData.initialSelectedDeltaId || null,
		fieldsWithDifferences,
	};
}

export const COMPARISON_SIDES = {
	BASE: 'base' as const,
	INCOMING: 'incoming' as const,
};

export type ComparisonSide = (typeof COMPARISON_SIDES)[keyof typeof COMPARISON_SIDES];
