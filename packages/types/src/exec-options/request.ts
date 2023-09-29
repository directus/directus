import type { z } from "zod";
import { EXEC_REQUEST } from "@directus/constants";

export type EXEC_REQUEST = z.infer<typeof EXEC_REQUEST>;
