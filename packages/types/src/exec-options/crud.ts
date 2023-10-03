import type { z } from "zod";
import { EXEC_CRUD } from "@directus/constants";

export type EXEC_CRUD = z.infer<typeof EXEC_CRUD>;
