import { findWorkspaceDir } from '@pnpm/find-workspace-dir';
import { findWorkspacePackagesNoCheck } from '@pnpm/find-workspace-packages';

export async function getPackages() {
	const workspaceRoot = await findWorkspaceDir(process.cwd());

	if (!workspaceRoot) {
		throw new Error(`Couldn't locate workspace root`);
	}

	return findWorkspacePackagesNoCheck(workspaceRoot);
}
