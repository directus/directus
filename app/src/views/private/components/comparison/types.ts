import type { ContentVersion, User } from '@directus/types';
import type { Activity } from '@/types/activity';
import type { Revision } from '@/types/revisions';

export type VersionComparisonResponse = {
	outdated: boolean;
	mainHash: string;
	current: Record<string, any>;
	main: Record<string, any>;
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
	user: string | User | null | undefined;
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

export type NormalizedComparison = {
	outdated: boolean;
	mainHash: string;
	incoming: Record<string, any>;
	base: Record<string, any>;
};

export type ComparisonData = {
	base: Record<string, any>;
	incoming: Record<string, any>;
	mainVersionMeta?: Pick<Activity, 'timestamp' | 'user'>;
	selectableDeltas?: Revision[] | ContentVersion[];
	revisionFields?: Set<string>;
	comparisonType: 'version' | 'revision';
	outdated?: boolean;
	mainHash?: string;
	currentVersion?: ContentVersion | null;
	initialSelectedDeltaId?: number | string;
	previousRevision?: Revision | null;
};
