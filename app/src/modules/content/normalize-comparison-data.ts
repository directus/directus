import api from '@/api';
import { unexpectedError } from '@/utils/unexpected-error';
import { ContentVersion } from '@directus/types';
import { Revision } from '@/types/revisions';
import { Ref } from 'vue';

export type ComparisonData = {
	base: Record<string, any>;
	delta: Record<string, any>;
	selectableDeltas?: Revision[] | ContentVersion[];
	comparisonType: 'version' | 'revision';
	outdated?: boolean;
	mainHash?: string;
	currentVersion?: ContentVersion | null; // Revision-specific: current version context
	initialSelectedDeltaId?: number | string; // ID of the currently selected delta (revision or version)
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
 * @param versions - The versions array from the versions composable (could be used for a version selector in the future)
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

	return await fetchVersionComparison(version.id, version);
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

async function fetchVersionComparison(versionId: string, version?: ContentVersion): Promise<ComparisonData> {
	try {
		const response = await api.get(`/versions/${versionId}/compare`);
		const data: VersionComparisonResponse = response.data.data;

		// For versions, we need to construct complete items for both base and delta
		// data.main is the complete main item (this should be the base/left side)
		// data.current contains the version's changes (this should be the delta/right side)
		const base = data.main; // Main item as the baseline
		const delta = data.current; // Version changes as the comparison

		return {
			base,
			delta,
			selectableDeltas: version ? [version] : [], // Include the version in selectableDeltas for collection/item access
			comparisonType: 'version' as const,
			outdated: data.outdated,
			mainHash: data.mainHash,
			initialSelectedDeltaId: version?.id,
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
 * - base: the complete item state BEFORE this revision was applied
 * - delta: the complete item state AFTER this revision was applied
 */
async function buildRevisionComparison(
	revision: Revision | RevisionComparisonResponse,
	currentVersion?: Ref<ContentVersion | null>,
	revisions?: Ref<Revision[] | null>,
): Promise<ComparisonData> {
	const revisionData = revision.data || {};

	let base: Record<string, any>;

	const revisionsList = revisions?.value || [];

	const revisionId = 'id' in revision ? revision.id : null;
	const currentRevisionIndex = revisionId ? revisionsList.findIndex((r) => r.id === revisionId) : -1;

	if (currentRevisionIndex > 0) {
		// Use the previous revision's data as the base (state before this revision)
		const previousRevision = revisionsList[currentRevisionIndex - 1];
		base = previousRevision?.data || {};

		// Add timestamp information to the base data for proper display
		if (previousRevision?.activity?.timestamp) {
			base = {
				...base,
				date_updated: previousRevision.activity.timestamp,
			};
		}
	} else {
		// This is the first revision, so we need to get the original item state
		if (currentVersion?.value) {
			const versionComparison = await fetchVersionComparison(currentVersion.value.id);
			base = versionComparison.base;
		} else {
			throw new Error('Cannot build revision comparison: no current version available');
		}
	}

	const delta = revisionData;

	return {
		base,
		delta,
		selectableDeltas: revisionsList,
		comparisonType: 'revision',
		outdated: false,
		mainHash: '',
		currentVersion: currentVersion?.value || null,
		initialSelectedDeltaId: revisionId || undefined,
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

export function getBaseTitle(comparisonData: ComparisonData | null): string {
	if (!comparisonData) return 'Main';

	switch (comparisonData.comparisonType) {
		case 'revision': {
			// For revisions, show the current version name on the left side
			const currentVersion = comparisonData.currentVersion;
			return currentVersion?.name || currentVersion?.key || 'Version';
		}

		case 'version':
			// For versions, the base is the main item, so we show "Main"
			return 'Main';
		default:
			return 'Main';
	}
}
