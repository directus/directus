import fse from 'fs-extra';
import { type Ora } from 'ora';
import type { Report } from '../../types.js';

const checkLicense = {
	name: 'license',
	handler: async (spinner: Ora, reports: Array<Report>) => {
		spinner.text = 'Check for LICENSE';

		if (!(await fse.pathExists(`${process.cwd()}/LICENSE`))) {
			spinner.fail();
			const message = 'No file named LICENSE found';

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
