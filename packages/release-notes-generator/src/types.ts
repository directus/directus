import { getInfo } from '@changesets/get-github-info';
import type { NewChangesetWithCommit } from '@changesets/types';
import { TYPE_MAP, UNTYPED_PACKAGES } from './constants';

type AsyncReturnType<T extends (...args: any) => Promise<any>> = T extends (...args: any) => Promise<infer R> ? R : any;

type GithubInfo = AsyncReturnType<typeof getInfo>;

export type Changesets = Map<string, Omit<NewChangesetWithCommit, 'id'> & { notice: string | undefined }>;

export type Change = { summary: string; commit: string | undefined; githubInfo: GithubInfo | undefined };

export type Notice = { notice: string; change: Change };

export type Package = { name: string; changes: Change[] };

type UntypedPackageName = (typeof UNTYPED_PACKAGES)[keyof typeof UNTYPED_PACKAGES];
export type UntypedPackage = { name: UntypedPackageName; changes: Change[] };

type TypeTitle = (typeof TYPE_MAP)[keyof typeof TYPE_MAP];
export type Type = { title: TypeTitle; packages: Package[] };

export type PackageVersion = { name: string; version: string };
