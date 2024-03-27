import { getInfo } from '@changesets/get-github-info';
import type { NewChangesetWithCommit, VersionType } from '@changesets/types';

type AsyncReturnType<T extends (...args: any) => Promise<any>> = T extends (...args: any) => Promise<infer R> ? R : any;

type GithubInfo = AsyncReturnType<typeof getInfo>;

export type Changesets = Map<string, Omit<NewChangesetWithCommit, 'id'> & { notice: string | undefined }>;

export interface Change {
	summary: string;
	commit: string | undefined;
	githubInfo: GithubInfo | undefined;
}

export interface Notice {
	notice: string;
	change: Change;
}

export interface Package {
	name: string;
	changes: Change[];
}

export interface UntypedPackage {
	name: string;
	changes: Change[];
}

export interface Type {
	title: string;
	packages: Package[];
}

export interface PackageVersion {
	name: string;
	version: string;
}

export interface Config {
	/** GitHub repository. */
	repo: string;
	/** Main package. */
	mainPackage: string;
	/** Titles for version types. */
	typedTitles: Record<VersionType, string>;
	/** Titles for untyped packages. */
	untypedPackageTitles: Record<string, string>;
	/** Title for list of published versions. */
	versionTitle: string;
	/** Under which version type notices should appear. */
	noticeType: VersionType;
	/** How packages should be sorted in the release notes. */
	packageOrder: string[];
	/**
	 * List of linked packages, where in case the first one is bumped,
	 * the second will be patch bumped if not already bumped anyway.
	 *
	 * Note: This is different from the option of `changesets`.
	 */
	linkedPackages: [string, string][];
}
