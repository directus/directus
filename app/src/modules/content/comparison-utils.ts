import { ContentVersion } from '@directus/types';
import { Revision } from '@/types/revisions';
import { isNil, isEqual } from 'lodash';

export type ComparisonData = {
	base: Record<string, any>;
	delta: Record<string, any>;
	selectableDeltas?: Revision[] | ContentVersion[];
	comparisonType: 'version' | 'revision';
	outdated?: boolean;
	mainHash?: string;
	currentVersion?: ContentVersion | null;
	initialSelectedDeltaId?: number | string;
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

/**
 * Get field names that have differences between two objects
 */
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

export function getRevisionDisplayName(revision: Revision): string {
	return `Revision ${revision.timestampFormatted}`;
}

export function getVersionUserId(version: ContentVersion): string | null {
	return version.user_updated || version.user_created || null;
}

export function getRevisionUserId(revision: Revision): string | null {
	const user = revision.activity.user;
	return typeof user === 'string' ? user : user?.id || null;
}

export function getVersionDate(version: ContentVersion): Date | null {
	return version.date_updated ? new Date(version.date_updated) : null;
}

export function getRevisionDate(revision: Revision): Date | null {
	const ts = revision.activity?.timestamp;
	return ts ? new Date(ts) : null;
}

export function getMainItemDate(mainItem: Record<string, any>): Date | null {
	const dateField = mainItem.date_updated;
	return dateField ? new Date(dateField) : null;
}

export function getMainItemUserId(mainItem: Record<string, any>): string | null {
	return mainItem.user_updated || mainItem.user_created || null;
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

// Consolidated selector functions from normalize-comparison-data.ts
export function getUserUpdated(comparisonData: ComparisonData): string | null {
	switch (comparisonData.comparisonType) {
		case 'revision':
			return comparisonData.delta.activity?.user || null;
		case 'version':
			return comparisonData.delta.user_updated || comparisonData.delta.user_created || null;
		default:
			return null;
	}
}

export function getDateUpdated(comparisonData: ComparisonData): Date | null {
	switch (comparisonData.comparisonType) {
		case 'revision':
			return comparisonData.delta.activity?.timestamp || null;
		case 'version':
			return comparisonData.delta.date_updated || null;
		default:
			return null;
	}
}

export function getBaseTitle(comparisonData: ComparisonData | null): string {
	if (!comparisonData) return 'Main';

	switch (comparisonData.comparisonType) {
		case 'revision': {
			const currentVersion = comparisonData.currentVersion;
			return currentVersion?.name || currentVersion?.key || 'Version';
		}

		case 'version':
			return 'Main';
		default:
			return 'Main';
	}
}
