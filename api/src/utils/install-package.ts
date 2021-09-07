import execa from 'execa';

export async function installPackage(name: string): Promise<boolean> {
	try {
		await execa('npm', ['install', name]);
	} catch {
		return false;
	}

	return true;
}

export async function uninstallPackage(name: string): Promise<boolean> {
	try {
		await execa('npm', ['uninstall', name]);
	} catch {
		return false;
	}

	return true;
}
