import { EXEC_CRUD } from "@directus/constants";
import { addExecOptions } from "../utils/add-exec-options.js";
import { getService } from "../../utils/get-service.js";
import { getSchema } from "../../utils/get-schema.js";


export default addExecOptions(({ extension }) => {

	async function handleCRUD(args: unknown[]) {

		const [type, collection, options] = EXEC_CRUD.parse(args);
		const schema = await getSchema();

		const service = getService(collection, { schema });

		if (type === 'create-items') {
			return service.createMany(options.data)
		} else if (type === 'read-items') {
			return service.readByQuery(options.query ?? {})
		} else if (type === 'update-items') {
			return service.updateByQuery(options.query ?? {}, options.data)
		} else {
			return service.deleteByQuery(options.query ?? {})
		}
	}

	return {
		'create-items': handleCRUD,
		'read-items': handleCRUD,
		'update-items': handleCRUD,
		'delete-items': handleCRUD,
	}
})
