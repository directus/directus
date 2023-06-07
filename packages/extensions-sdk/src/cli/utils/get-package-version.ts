import { execa } from 'execa';

export default async function getPackageVersion(name: string, tag = 'latest'): Promise<string> {
	const npmView = await execa('npm', ['view', name, '--json']);

	const packageInfo = JSON.parse(npmView.stdout);

	return packageInfo['dist-tags'][tag];
}
