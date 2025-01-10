import { findWorkspaceDir } from '@pnpm/find-workspace-dir';
import { findWorkspacePackagesNoCheck, type Project } from '@pnpm/workspace.find-packages';
import { defineLoader } from 'vitepress';

export default defineLoader({
	async load() {
		const workspaceDir = await findWorkspaceDir(process.cwd());
		if (!workspaceDir) throw new Error(`Couldn't find workspace dir`);
		const workspacePackages = await findWorkspacePackagesNoCheck(workspaceDir);

		const packages = Object.fromEntries(
			workspacePackages
				.filter(isValidPackage)
				.map(({ manifest: { name, version } }) => [name, { version: getDetailedVersion(version) }]),
		);

		return packages;
	},
});

function isValidPackage(workspacePackage: Project): workspacePackage is Project & {
	manifest: Project['manifest'] & Required<Pick<Project['manifest'], 'name' | 'version'>>;
} {
	const {
		manifest: { name, version },
	} = workspacePackage;

	return name !== undefined && version !== undefined;
}

function getDetailedVersion(version: string) {
	const splitVersion = version.split('.') as [string, string, string];

	return {
		full: version,
		major: splitVersion[0],
		minor: splitVersion.slice(0, 2).join('.'),
	};
}
