import type { z } from "zod";
import { EXEC_REGISTER_ENDPOINT } from "@directus/constants";

export type EXEC_REGISTER_ENDPOINT = z.infer<typeof EXEC_REGISTER_ENDPOINT>;
