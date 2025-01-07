import fse from 'fs-extra';
import { type Ora } from 'ora';
import path from 'path';
import type { Report } from '../../types.js';

const checkReadMe = {
	name: 'readme',
	handler: async (spinner: Ora, reports: Array<Report>) => {
		spinner.text = 'Check for README';

		if (!(await fse.pathExists(path.resolve('README.md'))) || !(await fse.pathExists(path.resolve('readme.md')))) {
			spinner.fail();

			const message = 'No readme file found';

			reports.push({
				level: 'error',
				message: `${checkReadMe.name}: ${message}`,
			});

			throw new Error(message);
		}

		const message = 'Valid README';

		reports.push({
			level: 'info',
			message: `${checkReadMe.name}: ${message}`,
		});

		return (spinner.text = message);
	},
};

export default checkReadMe;
