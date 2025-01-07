import fse from 'fs-extra';
import { type Ora } from 'ora';
import type { Report } from '../../types.js';
import path from 'path';

const checkLicense = {
	name: 'license',
	handler: async (spinner: Ora, reports: Array<Report>) => {
		spinner.text = 'Check for LICENSE';

		const packagePath = path.resolve(process.cwd(), 'package.json');

		let packageLicense = true;
		let licenseFile = true;

		if (await fse.pathExists(packagePath)) {
			const packageFile = await fse.readJson(packagePath);
			const { license } = packageFile;

			if (!license) {
				const message = 'No LICENSE within the packages.json';

				reports.push({
					level: 'warn',
					message: `${checkLicense.name}: ${message}`,
				});

				packageLicense = false;
			}
		}

		const licensePath = path.resolve(process.cwd(), 'LICENSE');

		if (!(await fse.pathExists(licensePath))) {
			const message = 'No file named LICENSE found';

			reports.push({
				level: 'warn',
				message: `${checkLicense.name}: ${message}`,
			});

			licenseFile = false;
		}

		if (!packageLicense && !licenseFile) {
			const message = 'No license defined';

			reports.push({
				level: 'error',
				message: `${checkLicense.name}: ${message}`,
			});

			throw new Error(message);
		}

		const message = 'Valid LICENSE';

		reports.push({
			level: 'info',
			message: `${checkLicense.name}: ${message}`,
		});

		return (spinner.text = message);
	},
};

export default checkLicense;
