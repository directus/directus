import { ContentVersion, User } from '@directus/types';
import { Revision } from '@/types/revisions';
import { isNil, isEqual } from 'lodash';

export type ComparisonData = {
	main: Record<string, any>;
	current: Record<string, any>;
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
	main: NormalizedItem;
	current: NormalizedItem;
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
	current: Record<string, any>;
	main: Record<string, any>;
};

export function getFieldsWithDifferences(comparedData: NormalizedComparison): string[] {
	return Object.keys(comparedData.current).filter((fieldKey) => {
		const versionValue = comparedData.current[fieldKey];
		const mainValue = comparedData.main[fieldKey];
		return !isEqual(versionValue, mainValue);
	});
}

export function getVersionDisplayName(version: ContentVersion): string {
	return isNil(version.name) ? version.key : version.name;
}

export function getRevisionDisplayName(): string {
	return `Revision Item`;
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
		displayName: getRevisionDisplayName(),
		date: normalizeDate(timestamp),
		user: normalizeUser(user as any),
		collection: revision.collection,
		item: revision.item,
	};
}

export function normalizeMainItem(mainData: Record<string, any>): NormalizedItem {
	return {
		id: 'main',
		displayName: 'Main',
		date: normalizeDate(mainData.date_updated),
		user: normalizeUser(mainData.user_updated || mainData.user_created),
	};
}

export function normalizeComparisonData(comparisonData: ComparisonData): NormalizedComparisonData {
	let main: NormalizedItem;

	if (comparisonData.comparisonType === 'revision' && comparisonData.currentVersion) {
		main = {
			id: 'main',
			displayName: getVersionDisplayName(comparisonData.currentVersion),
			date: normalizeDate(comparisonData.main.date_updated),
			user: normalizeUser(comparisonData.main.user_updated || comparisonData.main.user_created),
		};
	} else {
		main = normalizeMainItem(comparisonData.main);
	}

	let current: NormalizedItem;

	if (comparisonData.comparisonType === 'version') {
		const version = comparisonData.selectableDeltas?.[0] as ContentVersion;

		current = version
			? normalizeVersionItem(version)
			: {
					id: 'unknown',
					displayName: 'Unknown Version',
					date: { raw: null, formatted: null, dateObject: null },
					user: null,
				};
	} else {
		const revision = comparisonData.selectableDeltas?.[0] as Revision;

		current = revision
			? normalizeRevisionItem(revision)
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
		current: comparisonData.current,
		main: comparisonData.main,
	};

	const fieldsWithDifferences = getFieldsWithDifferences(normalizedComparison);

	return {
		main,
		current,
		selectableDeltas,
		comparisonType: comparisonData.comparisonType,
		outdated: comparisonData.outdated || false,
		mainHash: comparisonData.mainHash || '',
		currentVersion: comparisonData.currentVersion || null,
		initialSelectedDeltaId: comparisonData.initialSelectedDeltaId || null,
		fieldsWithDifferences,
	};
}
