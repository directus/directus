import { addExecOptions } from '../utils/add-exec-options.js';
import { EXEC_LOG } from '../validation/log.js';

export default addExecOptions(({ extension }) => {
	async function log(args: unknown[]) {
		const validOptions = EXEC_LOG.parse(args);

		// eslint-disable-next-line no-console
		console.log(`${extension.name}: ${validOptions[1]}`);
	}

	return {
		log: log,
	};
});
