import { EXEC_CRUD } from "@directus/constants";
import { addExecOptions } from "../utils/add-exec-options.js";
import { getService } from "../../utils/get-service.js";
import { getSchema } from "../../utils/get-schema.js";
import type { Accountability, ExtensionPermission } from "@directus/types";


export default addExecOptions(({ extension }) => {

	async function handleCRUD(args: unknown[]) {

		const [type, collection, options] = EXEC_CRUD.parse(args);


		const permission = extension.granted_permissions?.find((permission) => ['create-items', 'read-items', 'update-items', 'delete-items'].includes(permission.permission)) as ExtensionPermission & { permission: 'create-items' | 'read-items' | 'update-items' | 'delete-items' }

		if (!permission) {
			throw new Error(`You do not have access to "${type}"`);
		}

		const accountability: Accountability = {
			role: null,
			admin: true
		}

		if (permission?.role) {
			accountability.role = permission.role
			accountability.admin = false
		}

		const schema = await getSchema();

		const service = getService(collection, { schema, accountability });

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
