import type { ExtensionType } from '@directus/extensions';

export interface DescribeResultPackage {
	name: string;
	version: string;
	description: string;
	readme: string;
	type: ExtensionType | null;
	author: string;
	maintainers: string[];
	versions: string[];
	fileCount: number;
	size: number;
	host: string;
	tarball: string;
	homepage: string | null;
	bugs: string | null;
	repository: string | null;
	license: string | null;
}

export interface DescribeResult {
	data: DescribeResultPackage;
}
