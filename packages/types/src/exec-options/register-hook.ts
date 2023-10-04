import type { z } from "zod";
import { EXEC_REGISTER_HOOK } from "@directus/constants";

export type EXEC_REGISTER_HOOK = z.infer<typeof EXEC_REGISTER_HOOK>;
