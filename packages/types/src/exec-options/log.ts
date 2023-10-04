import type { z } from "zod";
import { EXEC_LOG } from "@directus/constants";

export type EXEC_LOG = z.infer<typeof EXEC_LOG>;
