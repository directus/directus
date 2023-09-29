import { EXEC_LOG } from "@directus/constants";
import { addExecOptions } from "../add-exec-options.js";


export default addExecOptions(({ extension }) => {

	async function log(options: unknown) {

		const validOptions = EXEC_LOG.parse(options);

		// eslint-disable-next-line no-console
		console.log(`${extension.name}: ${validOptions}`)
	}

	return {
		'log': log,
	}
})
