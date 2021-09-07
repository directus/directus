import execa from 'execa';

export default async function installPackage(name: string): Promise<boolean> {
	try {
		await execa('npm', ['install', name]);
	} catch {
		return false;
	}

	return true;
}
