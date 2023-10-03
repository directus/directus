import { EXEC_REGISTER_ENDPOINT, EXEC_REGISTER_HOOK, EXEC_REGISTER_OPERATION } from "@directus/constants";
import type { Reference } from 'isolated-vm';
import { z } from "zod";

// replace all handler functions with isolated-vm references
export function handlerAsReference<T extends (typeof EXEC_REGISTER_ENDPOINT | typeof EXEC_REGISTER_HOOK | typeof EXEC_REGISTER_OPERATION)>(parser: T) {

	const customReference = z.custom<Reference>(value => value) as any

	if (parser._def.typeName === 'ZodTuple') {
		// For endpoints and operations
		parser._def.items[1]._def.shape().handler = customReference
	} else {
		// For hooks
		parser._def.options[0]._def.items[1]._def.shape().handler = customReference
		parser._def.options[1]._def.items[1]._def.shape().handler = customReference
	}
}
