import { getInfo } from '@changesets/get-github-info';
import type { NewChangesetWithCommit } from '@changesets/types';

type AsyncReturnType<T extends (...args: any) => Promise<any>> = T extends (...args: any) => Promise<infer R> ? R : any;

type GithubInfo = AsyncReturnType<typeof getInfo>;

export type ChangesetsWithoutId = Map<string, Omit<NewChangesetWithCommit, 'id'>>;

export type Change = { summary: string; commit: string | undefined; githubInfo: GithubInfo | undefined };

export type Package = {
	name: string;
	changes: Change[];
};

export type Type = { title: string; packages: Package[] };

export type PackageVersion = {
	name: string;
	version: string;
};

export type PackageInfo = {
	name: string;
	version: string;
	path: string;
	private: boolean;
};
