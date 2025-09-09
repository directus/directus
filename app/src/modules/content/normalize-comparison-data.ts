import api from '@/api';
import { unexpectedError } from '@/utils/unexpected-error';
import { ContentVersion } from '@directus/types';
import { Revision } from '@/types/revisions';
import { Ref } from 'vue';
import { merge } from 'lodash';

export type ComparisonData = {
	base: Record<string, any>; // Complete item state (before changes)
	delta: Record<string, any>; // Complete item state (after changes)
	selectableDeltas?: Revision[] | ContentVersion[];
	comparisonType: 'version' | 'revision';
	outdated?: boolean; // Version-specific: whether version is outdated
	mainHash?: string; // Version-specific: hash of main item
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

/**
 * Normalizes comparison data for versions or revisions so that it can be used in the comparison modal.
 * This function checks if the data is available in the composables and fetches comparison data from the API if needed.
 *
 * @param id - The ID of the version or revision to compare
 * @param type - Whether this is a 'version' or 'revision'
 * @param currentVersion - The current version from the versions composable (used for the base state when comparing revisions)
 * @param versions - The versions array from the versions composable (optional, for versions)
 * @param revisions - The revisions array from the revisions composable (used for the revision selector)
 * @returns Promise<ComparisonData> - Normalized comparison data with base and delta
 */
export async function normalizeComparisonData(
	id: string,
	type: 'version' | 'revision',
	currentVersion?: Ref<ContentVersion | null>,
	versions?: Ref<ContentVersion[] | null>,
	revisions?: Ref<Revision[] | null>,
): Promise<ComparisonData> {
	if (type === 'version') {
		return await normalizeVersionComparison(id, currentVersion, versions);
	} else {
		return await normalizeRevisionComparison(id, currentVersion, revisions);
	}
}

async function normalizeVersionComparison(
	versionId: string,
	currentVersion?: Ref<ContentVersion | null>,
	versions?: Ref<ContentVersion[] | null>,
): Promise<ComparisonData> {
	const version = getVersionFromComposable(versionId, currentVersion, versions);

	if (!version) {
		return await fetchVersionComparison(versionId);
	}

	return await fetchVersionComparison(version.id);
}

async function normalizeRevisionComparison(
	revisionId: string,
	currentVersion?: Ref<ContentVersion | null>,
	revisions?: Ref<Revision[] | null>,
): Promise<ComparisonData> {
	const revision = getRevisionFromComposable(revisionId, revisions);

	if (!revision) {
		return await fetchRevisionComparison(revisionId, currentVersion, revisions);
	}

	return await buildRevisionComparison(revision, currentVersion, revisions);
}

function getVersionFromComposable(
	versionId: string,
	currentVersion?: Ref<ContentVersion | null>,
	versions?: Ref<ContentVersion[] | null>,
): ContentVersion | null {
	if (currentVersion?.value && currentVersion.value.id === versionId) {
		return currentVersion.value;
	}

	if (versions?.value) {
		return versions.value.find((version) => version.id === versionId) || null;
	}

	return null;
}

function getRevisionFromComposable(revisionId: string, revisions?: Ref<Revision[] | null>): Revision | null {
	if (revisions?.value) {
		return revisions.value.find((revision) => revision.id === parseInt(revisionId)) || null;
	}

	return null;
}

async function fetchVersionComparison(versionId: string): Promise<ComparisonData> {
	try {
		const response = await api.get(`/versions/${versionId}/compare`);
		const data: VersionComparisonResponse = response.data.data;

		// For versions, we need to construct complete items for both base and delta
		// data.main is the complete main item
		// data.current is only the delta (changes), so we need to merge it with the main item
		const base = data.main;
		const delta = merge(data.main, data.current); // Deep merge main item with version changes

		return {
			base,
			delta,
			comparisonType: 'version',
			outdated: data.outdated,
			mainHash: data.mainHash,
		};
	} catch (error) {
		unexpectedError(error);
		throw error;
	}
}

async function fetchRevisionComparison(
	revisionId: string,
	currentVersion?: Ref<ContentVersion | null>,
	revisions?: Ref<Revision[] | null>,
): Promise<ComparisonData> {
	try {
		const response = await api.get(`/revisions/${revisionId}`, {
			params: {
				fields: ['id', 'data', 'delta', 'collection', 'item', 'activity.action', 'activity.timestamp', 'activity.user'],
			},
		});

		const revision: RevisionComparisonResponse = response.data.data;

		return await buildRevisionComparison(revision, currentVersion, revisions);
	} catch (error) {
		unexpectedError(error);
		throw error;
	}
}

/**
 * Builds comparison data from revision data
 * For revisions, we need to construct the complete items:
 * - base: the complete item state of the currently selected version
 * - delta: the complete item state after this revision
 */
async function buildRevisionComparison(
	revision: Revision | RevisionComparisonResponse,
	currentVersion?: Ref<ContentVersion | null>,
	revisions?: Ref<Revision[] | null>,
): Promise<ComparisonData> {
	const revisionData = revision.data || {};

	let base: Record<string, any>;

	if (currentVersion?.value) {
		const versionComparison = await fetchVersionComparison(currentVersion.value.id);
		base = versionComparison.delta; // Complete item of the selected version
	} else {
		throw new Error('Cannot build revision comparison: no current version available');
	}

	const delta = revisionData;

	return {
		base,
		delta,
		selectableDeltas: revisions?.value || ([] as Revision[]),
		comparisonType: 'revision',
		outdated: false,
		mainHash: '',
	};
}

/** Selectors	**/
export function getUserUpdated(comparisonData: ComparisonData): string | null {
	switch (comparisonData.comparisonType) {
		case 'revision':
			return comparisonData.delta.activity.user || null;
		case 'version':
			return comparisonData.delta.user_updated || comparisonData.delta.user_created || null;
		default:
			return null;
	}
}

export function getDateUpdated(comparisonData: ComparisonData): Date | null {
	switch (comparisonData.comparisonType) {
		case 'revision':
			return comparisonData.delta.activity.timestamp || null;
		case 'version':
			return comparisonData.delta.date_updated || null;
		default:
			return null;
	}
}
