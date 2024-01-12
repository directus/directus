import { UnprocessableContentError } from '@directus/errors';
import { getPackageExtensionType } from '../../../utils/get-package-extension-type.js';
import type { RegistryDescribeResponse } from '../schemas/registry-describe-response.js';
import type { DescribeResult } from '../types/describe-result.js';
import { getRepositoryUrl } from '../utils/get-repository-url.js';

export const convertToDescribeResult = (registryResponse: RegistryDescribeResponse): DescribeResult => {
	const latestVersion = registryResponse.versions[registryResponse['dist-tags'].latest];

	if (!latestVersion) {
		throw new UnprocessableContentError({
			reason: `Could not find package information for version ${registryResponse['dist-tags'].latest}`,
		});
	}

	if (!latestVersion['directus:extension']) {
		throw new UnprocessableContentError({
			reason: `Extension ${registryResponse.name} does not contain a Directus Extensions Manifest`,
		});
	}

	return {
		data: {
			name: registryResponse.name,
			description: registryResponse.description,
			version: registryResponse['dist-tags'].latest,
			type: getPackageExtensionType(registryResponse.keywords),
			publisher: latestVersion._npmUser.name,
			maintainers: registryResponse.maintainers.map(({ name }) => name),
			readme: registryResponse.readme,
			versions: Object.keys(registryResponse.versions),
			fileCount: latestVersion.dist.fileCount,
			size: latestVersion.dist.unpackedSize,
			host: latestVersion['directus:extension'].host,
			homepage: registryResponse.homepage ?? null,
			bugs: registryResponse.bugs?.url ?? null,
			license: registryResponse.license ?? null,
			repository: registryResponse.repository ? getRepositoryUrl(registryResponse.repository) : null,
			tarball: latestVersion.dist.tarball,
		},
	};
};
