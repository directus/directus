import type { Report } from '../../types.js';
import fse from 'fs-extra';
import { type Ora } from 'ora';
import path from 'path';

const checkLicense = {
	name: 'license',
	handler: async (spinner: Ora, reports: Array<Report>) => {
		spinner.text = 'Check for license';

		const packagePath = path.resolve('package.json');
		const { license } = await fse.readJson(packagePath);

		if (!license) {
			const message = 'No license defined';

			reports.push({
				level: 'error',
				message: `${checkLicense.name}: ${message}`,
			});

			throw new Error(message);
		}

		const message = 'Valid license';

		reports.push({
			level: 'info',
			message: `${checkLicense.name}: ${message}`,
		});

		return (spinner.text = message);
	},
};

export default checkLicense;
