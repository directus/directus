import type { z } from "zod";
import { EXEC_REGISTER_ENDPOINT, EXEC_REGISTER_ENDPOINT_RESPONSE } from "@directus/constants";

export type EXEC_REGISTER_ENDPOINT = z.infer<typeof EXEC_REGISTER_ENDPOINT>;
export type EXEC_REGISTER_ENDPOINT_RESPONSE = z.infer<typeof EXEC_REGISTER_ENDPOINT_RESPONSE>;
