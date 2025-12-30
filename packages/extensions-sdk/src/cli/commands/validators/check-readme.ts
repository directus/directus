import type { Report } from '../../types.js';
import { opendir } from 'node:fs/promises';
import { type Ora } from 'ora';

const checkReadMe = {
	name: 'readme',
	handler: async (spinner: Ora, reports: Array<Report>) => {
		spinner.text = 'Check for readme';

		if (!(await hasReadmeFile())) {
			spinner.fail();

			const message = 'No readme file found';

			reports.push({
				level: 'error',
				message: `${checkReadMe.name}: ${message}`,
			});

			throw new Error(message);
		}

		const message = 'Valid readme';

		reports.push({
			level: 'info',
			message: `${checkReadMe.name}: ${message}`,
		});

		return (spinner.text = message);
	},
};

async function hasReadmeFile() {
	/** README can have any case and extension */
	const README_FILE_REGEX = /readme(\..+)?/i;

	const dir = await opendir(process.cwd());

	for await (const dirent of dir) {
		if (dirent.isFile() && README_FILE_REGEX.test(dirent.name)) return true;
	}

	return false;
}

export default checkReadMe;
