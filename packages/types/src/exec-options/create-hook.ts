import type { z } from "zod";
import { EXEC_CREATE_HOOK } from "@directus/constants";

export type EXEC_CREATE_HOOK = z.infer<typeof EXEC_CREATE_HOOK>;
