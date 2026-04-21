import { deactivateCurrentLicense } from '../../../license/lifecycle.js';

export default async function deactivateLicenseCommand(): Promise<void> {
	try {
		await deactivateCurrentLicense();
		process.stdout.write('License deactivated.\n');
		process.exit(0);
	} catch (error) {
		process.stderr.write(error instanceof Error ? error.message : String(error));
		process.stderr.write('\n');
		process.exit(1);
	}
}
