import { getInfo } from '@changesets/get-github-info';
import type { NewChangesetWithCommit } from '@changesets/types';
import { TYPE_MAP } from './constants';

type AsyncReturnType<T extends (...args: any) => Promise<any>> = T extends (...args: any) => Promise<infer R> ? R : any;

type GithubInfo = AsyncReturnType<typeof getInfo>;

export type ChangesetsWithoutId = Map<string, Omit<NewChangesetWithCommit, 'id'>>;

export type Change = { summary: string; commit: string | undefined; githubInfo: GithubInfo | undefined };

export type Package = {
	name: string;
	changes: Change[];
};

type TypeValues = (typeof TYPE_MAP)[keyof typeof TYPE_MAP];
export type Type = { title: TypeValues; packages: Package[] };

export type PackageVersion = {
	name: string;
	version: string;
};
