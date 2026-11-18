import path from 'node:path';
import { type Ora } from 'ora';
import type { Report } from '../../types.js';
import { readJson } from '../../utils/json.js';

const checkLicense = {
	name: 'license',
	handler: async (spinner: Ora, reports: Array<Report>): Promise<string> => {
		spinner.text = 'Check for license';

		const packagePath = path.resolve('package.json');
		const { license } = await readJson(packagePath);

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
