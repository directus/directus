import { findWorkspaceDir } from '@pnpm/find-workspace-dir';
import { Project, findWorkspacePackagesNoCheck } from '@pnpm/find-workspace-packages';

export async function getPackages() {
	const workspaceRoot = await findWorkspaceDir(process.cwd());

	if (!workspaceRoot) {
		throw new Error(`Couldn't locate workspace root`);
	}

	return findWorkspacePackagesNoCheck(workspaceRoot);
}

export function getPackageVersion(packages: Project[], name: string) {
	return packages.find((p) => p.manifest.name === name)?.manifest.version;
}
