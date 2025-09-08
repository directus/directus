import { ContentVersion } from '@directus/types';
import { Revision } from '@/types/revisions';
import { isNil, isEqual, merge } from 'lodash';

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

export function normalizeComparisonData(
	comparisonData: ContentVersion | Revision,
	comparisonType: 'version' | 'revision',
): NormalizedComparison {
	if (comparisonType === 'version') {
		const version = comparisonData as ContentVersion;

		return {
			outdated: false, // TODO: determine if the version is outdated
			mainHash: version.hash,
			current: version.delta || {},
			main: {}, // TODO: populate from the main item data
		};
	} else if (comparisonType === 'revision') {
		const revision = comparisonData as Revision;

		return {
			outdated: false, // Revisions don't have hash-based change detection
			mainHash: '', // Revisions don't use hash comparison
			current: revision.delta || {},
			main: revision.data || {},
		};
	} else {
		throw new Error('Invalid comparison type');
	}
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
	const dateField = mainItem.date_updated || mainItem.modified_on || mainItem.updated_on;
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

export function createRevisionComparison(
	baseline: Record<string, any>,
	revision: Revision,
	previousRevision?: Revision,
): NormalizedComparison {
	let baselineLeft = baseline;

	// Apply previous revision changes to create the baseline for comparison
	if (previousRevision) {
		baselineLeft = merge({}, baseline, previousRevision.data);
	}

	const completeRevisionItem = merge({}, baselineLeft, revision.data);

	return {
		outdated: false,
		mainHash: '',
		current: completeRevisionItem,
		main: baselineLeft,
	};
}

export function areAllFieldsSelected(selectedFields: string[], availableFields: string[]): boolean {
	return availableFields.length > 0 && availableFields.every((field) => selectedFields.includes(field));
}

export function areSomeFieldsSelected(selectedFields: string[], availableFields: string[]): boolean {
	return availableFields.length > 0 && availableFields.some((field) => selectedFields.includes(field));
}
