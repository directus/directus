import { z } from "zod";

export const EXEC_REGISTER_OPERATION_RESPONSE = z.union([z.record(z.string()), z.void()])

export const EXEC_REGISTER_OPERATION = z.tuple([
	z.literal('register-operation'),
	z.object({
		'id': z.string(),
		'handler': z.function(z.tuple([z.record(z.any())]), EXEC_REGISTER_OPERATION_RESPONSE.promise())
	})
])
